package modules_test

import (
	"bytes"
	"database/sql"
	"fmt"
	"testing"

	"github.com/gin-gonic/gin"
	"hospital-hims/backend/core-go/internal/auditlog"
	"hospital-hims/backend/core-go/internal/auth"
	"hospital-hims/backend/core-go/internal/testsupport"
)

func TestMFALoginAuditFailureRollsBackCodeConsumption(t *testing.T) {
	db := testsupport.OpenDB(t)
	target := seed(t, db)
	password := "Synthetic MFA rollback password"
	hash, err := auth.HashPassword(password)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = db.Exec(`UPDATE users SET password_hash=$2 WHERE id=$1`, target.user, hash); err != nil {
		t.Fatal(err)
	}
	testsupport.SeedMFASession(t, db, target.user)
	code := testsupport.SeedRecoveryCode(t, db, target.user)
	var username string
	if err = db.QueryRow(`SELECT username FROM users WHERE id=$1`, target.user).Scan(&username); err != nil {
		t.Fatal(err)
	}
	tokens := auth.NewTokenService([]byte("synthetic-login-audit-rollback-key"))
	for _, connection := range []*sql.DB{withoutAuditInsert(t, db), db} {
		h, err := auth.NewSecurityHandler(connection, tokens, auditlog.NewWriter(connection), bytes.Repeat([]byte{42}, 32))
		if err != nil {
			t.Fatal(err)
		}
		r := gin.New()
		r.POST("/login", h.HandleLogin)
		w := operationsRequest(r, "POST", "/login", fmt.Sprintf(`{"username":%q,"password":%q,"code":%q}`, username, password, code), "")
		want := 200
		if connection != db {
			want = 503
		}
		if w.Code != want {
			t.Fatalf("Login with audit availability: %d %s", w.Code, w.Body)
		}
		var consumed bool
		if err = db.QueryRow(`SELECT consumed_at IS NOT NULL FROM auth_recovery_codes WHERE user_id=$1`, target.user).Scan(&consumed); err != nil {
			t.Fatal(err)
		}
		if consumed != (connection == db) {
			t.Fatal("Recovery consumption did not follow audit commit")
		}
		var sessions int
		if err = db.QueryRow(`SELECT count(*) FROM auth_sessions WHERE user_id=$1`, target.user).Scan(&sessions); err != nil {
			t.Fatal(err)
		}
		expected := 1
		if connection == db {
			expected = 2
		}
		if sessions != expected {
			t.Fatal("Unaudited session persisted")
		}
	}
}

func TestMFASecurityAdministrationAuthorityAndAuditRollback(t *testing.T) {
	db := testsupport.OpenDB(t)
	actor, target, reviewer := seed(t, db), seed(t, db), seed(t, db)
	if _, err := db.Exec(`UPDATE users SET role='AUDITOR' WHERE id=$1`, reviewer.user); err != nil {
		t.Fatal(err)
	}
	tokens := auth.NewTokenService([]byte("synthetic-security-administration-key"))
	mint := func(id string) string {
		t.Helper()
		s := testsupport.SeedMFASession(t, db, id)
		token, err := tokens.GenerateSession(id, "Synthetic", "ADMIN", "Test", 0, s)
		if err != nil {
			t.Fatal(err)
		}
		return token
	}
	actorToken, targetToken, reviewToken := mint(actor.user), mint(target.user), mint(reviewer.user)
	testsupport.SeedRecoveryCode(t, db, target.user)
	h, err := auth.NewSecurityHandler(db, tokens, auditlog.NewWriter(db), bytes.Repeat([]byte{42}, 32))
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	h.RegisterAdminRoutes(r.Group("/api/v1"))
	restricted := withoutAuditInsert(t, db)
	deniedHandler, err := auth.NewSecurityHandler(restricted, tokens, auditlog.NewWriter(restricted), bytes.Repeat([]byte{42}, 32))
	if err != nil {
		t.Fatal(err)
	}
	denied := gin.New()
	deniedHandler.RegisterAdminRoutes(denied.Group("/api/v1"))
	if w := operationsRequest(r, "GET", "/api/v1/admin/security", "", reviewToken); w.Code != 200 {
		t.Fatalf("AUDITOR policy read: %d", w.Code)
	}
	for _, suffix := range []string{"unlock", "reset-mfa"} {
		if _, err := db.Exec(`UPDATE auth_account_security SET failed_attempts=5,locked_until=NOW()+INTERVAL '15 minutes' WHERE user_id=$1`, target.user); err != nil {
			t.Fatal(err)
		}
		path := "/api/v1/admin/security/users/" + target.user + "/" + suffix
		body := `{"reason":"Synthetic verified staff recovery","identity_verified":true}`
		for _, tc := range []struct {
			router *gin.Engine
			token  string
			want   int
		}{{r, "", 401}, {r, reviewToken, 403}, {denied, actorToken, 503}} {
			w := operationsRequest(tc.router, "POST", path, body, tc.token)
			if w.Code != tc.want {
				t.Fatalf("%s: %d %s", suffix, w.Code, w.Body)
			}
		}
		var failures, version int
		var enrolled bool
		if err := db.QueryRow(`SELECT a.failed_attempts,a.mfa_enrolled_at IS NOT NULL,u.token_version FROM users u JOIN auth_account_security a ON a.user_id=u.id WHERE u.id=$1`, target.user).Scan(&failures, &enrolled, &version); err != nil {
			t.Fatal(err)
		}
		if failures != 5 || !enrolled || version != 0 {
			t.Fatal("Denied or unaudited change persisted")
		}
		if w := operationsRequest(r, "POST", path, body, actorToken); w.Code != 200 {
			t.Fatalf("Approved recovery: %d %s", w.Code, w.Body)
		}
		if suffix == "unlock" {
			if err := db.QueryRow(`SELECT failed_attempts,mfa_enrolled_at IS NOT NULL FROM auth_account_security WHERE user_id=$1`, target.user).Scan(&failures, &enrolled); err != nil {
				t.Fatal(err)
			}
			if failures != 0 || !enrolled {
				t.Fatal("Unlock failed or removed MFA")
			}
		}
	}
	if w := operationsRequest(r, "GET", "/api/v1/admin/security", "", targetToken); w.Code != 401 {
		t.Fatal("Reset target session remained valid")
	}
	if w := operationsRequest(r, "POST", "/api/v1/admin/security/users/"+actor.user+"/reset-mfa", `{"reason":"Synthetic","identity_verified":true}`, actorToken); w.Code != 403 {
		t.Fatal("Self MFA reset accepted")
	}
	if w := operationsRequest(r, "POST", "/api/v1/admin/security/users/"+target.user+"/reset-mfa", `{"reason":"Synthetic"}`, actorToken); w.Code != 400 {
		t.Fatal("Identity verification omitted")
	}
	var remaining int
	if err := db.QueryRow(`SELECT count(*) FROM auth_recovery_codes WHERE user_id=$1 AND consumed_at IS NULL`, target.user).Scan(&remaining); err != nil || remaining != 0 {
		t.Fatal("Reset retained usable recovery codes")
	}
}
