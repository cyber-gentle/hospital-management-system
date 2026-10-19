package auth

import (
	"bytes"
	"context"
	"encoding/base32"
	"encoding/json"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"hospital-hims/backend/core-go/internal/auditlog"
	"hospital-hims/backend/core-go/internal/testsupport"
)

func TestSecurityLoginEnrollmentReplayRecoveryAndLockout(t *testing.T) {
	db := testsupport.OpenDB(t)
	username := seedUser(t, db, seedOptions{prefix: "mfa", password: "synthetic secure password", role: "NURSE"})
	tokens := NewTokenService([]byte("synthetic_security_test_signing_key"))
	h, err := NewSecurityHandler(db, tokens, auditlog.NewWriter(db), bytes.Repeat([]byte{42}, 32))
	if err != nil {
		t.Fatal(err)
	}
	gin.SetMode(gin.TestMode)
	r := gin.New()
	r.POST("/login", h.HandleLogin)
	post := func(password, code string) (int, map[string]json.RawMessage) {
		t.Helper()
		payload, err := json.Marshal(map[string]string{"username": username, "password": password, "code": code})
		if err != nil {
			t.Fatal(err)
		}
		req := httptest.NewRequest("POST", "/login", bytes.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		r.ServeHTTP(rec, req)
		var result map[string]json.RawMessage
		if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		return rec.Code, result
	}
	status, result := post("synthetic secure password", "")
	if status != 200 || result["token"] != nil || string(result["enrollment_required"]) != "true" {
		t.Fatalf("Password alone must require enrollment: %d", status)
	}
	var encoded string
	if err = json.Unmarshal(result["secret"], &encoded); err != nil {
		t.Fatal(err)
	}
	raw, err := base32.StdEncoding.WithPadding(base32.NoPadding).DecodeString(encoded)
	if err != nil {
		t.Fatal(err)
	}
	code := totpCode(raw, time.Now().Unix()/30)
	status, result = post("synthetic secure password", code)
	if status != 200 || result["token"] == nil {
		t.Fatalf("Enrollment confirmation: %d", status)
	}
	var token string
	if err = json.Unmarshal(result["token"], &token); err != nil {
		t.Fatal(err)
	}
	claims, err := tokens.Validate(token)
	if err != nil || claims.ID == "" {
		t.Fatal("Missing session-bound JWT")
	}
	if _, err = TouchSession(context.Background(), db, claims.UserID, claims.ID, claims.TokenVersion); err != nil {
		t.Fatalf("Fresh MFA session rejected: %v", err)
	}
	if _, err = TouchSession(context.Background(), db, claims.UserID, "", claims.TokenVersion); err == nil {
		t.Fatal("Legacy token accepted without MFA session")
	}
	if _, err = db.Exec(`UPDATE auth_sessions SET last_activity_at=NOW()-INTERVAL '31 minutes' WHERE id=$1`, claims.ID); err != nil {
		t.Fatal(err)
	}
	if _, err = TouchSession(context.Background(), db, claims.UserID, claims.ID, claims.TokenVersion); err == nil {
		t.Fatal("Idle session revived")
	}
	var backups []string
	if err = json.Unmarshal(result["backup_codes"], &backups); err != nil || len(backups) != 10 {
		t.Fatal("Missing recovery codes")
	}
	status, _ = post("synthetic secure password", code)
	if status != 401 {
		t.Fatal("TOTP replay accepted")
	}
	status, result = post("synthetic secure password", "")
	if status != 200 || result["secret"] != nil || result["token"] != nil {
		t.Fatal("Enrolled account leaked secret or skipped MFA")
	}
	status, _ = post("synthetic secure password", backups[0])
	if status != 200 {
		t.Fatal("Recovery code rejected")
	}
	status, _ = post("synthetic secure password", backups[0])
	if status != 401 {
		t.Fatal("Recovery code replay accepted")
	}
	// One failed recovery plus four bad passwords must lock the account.
	for i := 0; i < 4; i++ {
		status, _ = post("wrong password", "")
		if status != 401 {
			t.Fatal("Wrong password accepted")
		}
	}
	var failed int
	var remaining float64
	err = db.QueryRow(`SELECT a.failed_attempts,EXTRACT(EPOCH FROM (a.locked_until-now())) FROM auth_account_security a JOIN users u ON u.id=a.user_id WHERE u.username=$1`, username).Scan(&failed, &remaining)
	if err != nil || failed != 5 || remaining < 880 || remaining > 900 {
		t.Fatalf("Lockout not persisted: failures=%d seconds=%f err=%v", failed, remaining, err)
	}
	status, _ = post("synthetic secure password", backups[1])
	if status != 401 {
		t.Fatal("Valid factor bypassed active lockout")
	}
	if _, err = db.Exec(`UPDATE auth_account_security SET locked_until=NOW()-INTERVAL '1 second' WHERE user_id=$1`, claims.UserID); err != nil {
		t.Fatal(err)
	}
	status, _ = post("synthetic secure password", backups[1])
	if status != 200 {
		t.Fatal("Timed lockout did not expire")
	}
	// Two simultaneous submissions of one backup code must create one session.
	payload, err := json.Marshal(map[string]string{"username": username, "password": "synthetic secure password", "code": backups[2]})
	if err != nil {
		t.Fatal(err)
	}
	results := make(chan int, 2)
	for i := 0; i < 2; i++ {
		go func() {
			req := httptest.NewRequest("POST", "/login", bytes.NewReader(payload))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder()
			r.ServeHTTP(rec, req)
			results <- rec.Code
		}()
	}
	first, second := <-results, <-results
	if !((first == 200 && second == 401) || (first == 401 && second == 200)) {
		t.Fatalf("Concurrent code consumption: %d, %d", first, second)
	}
	var leaked bool
	err = db.QueryRow(`SELECT EXISTS(SELECT 1 FROM audit_logs WHERE resource_id=$1 AND (details::text LIKE $2 OR details::text LIKE $3))`, claims.UserID, "%"+encoded+"%", "%"+backups[1]+"%").Scan(&leaked)
	if err != nil || leaked {
		t.Fatal("Secrets leaked to audit")
	}
}
