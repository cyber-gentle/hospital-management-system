package modules_test

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	adminmodule "hospital-hims/services/core-go/internal/modules/admin"
	"hospital-hims/services/core-go/internal/testsupport"
	"strings"
	"testing"
)

func adminRouter(db *sql.DB, tokens *auth.TokenService) *gin.Engine {
	r := gin.New()
	adminmodule.NewHandler(db, auditlog.NewWriter(db), tokens).RegisterRoutes(r.Group("/api/v1"))
	return r
}
func TestAdministrationAuthorityAndAtomicAudit(t *testing.T) {
	db := testsupport.OpenDB(t)
	f := seed(t, db)
	reviewer := seed(t, db)
	if _, err := db.Exec("UPDATE users SET role='AUDITOR' WHERE id=$1", reviewer.user); err != nil {
		t.Fatal(err)
	}
	// Even an explicit write grant cannot turn an AUDITOR into an administrator.
	if _, err := db.Exec("INSERT INTO user_permissions(user_id,permission_id) VALUES($1,'admin:write')", reviewer.user); err != nil {
		t.Fatal(err)
	}
	tokens := auth.NewTokenService([]byte("synthetic-admin-test-signing-key"))
	token, err := tokens.GenerateSession(f.user, "Forged name", "ADMIN", "Test", 0, testsupport.SeedMFASession(t, db, f.user))
	if err != nil {
		t.Fatal(err)
	}
	reviewToken, err := tokens.GenerateSession(reviewer.user, "Synthetic", "ADMIN", "Test", 0, testsupport.SeedMFASession(t, db, reviewer.user))
	if err != nil {
		t.Fatal(err)
	}
	r := adminRouter(db, tokens)
	restrictedDB := withoutAuditInsert(t, db)
	var role string
	if err := restrictedDB.QueryRow("SELECT current_user").Scan(&role); err != nil {
		t.Fatal(err)
	}
	if _, err := db.Exec("GRANT DELETE ON user_permissions TO " + pgx.Identifier{role}.Sanitize()); err != nil {
		t.Fatal(err)
	}
	auditDenied := adminRouter(restrictedDB, tokens)
	name := testsupport.UniqueID("named_staff")
	password := "Synthetic test password only"
	body := fmt.Sprintf(`{"username":%q,"email":%q,"firstName":"Synthetic","lastName":"Staff","role":"AUDITOR","department":"Review","password":%q}`, name, name+"@example.invalid", password)
	for _, scenario := range []struct {
		r      *gin.Engine
		token  string
		status int
	}{{r, "", 401}, {r, reviewToken, 403}, {auditDenied, token, 503}} {
		w := operationsRequest(scenario.r, "POST", "/api/v1/admin/users", body, scenario.token)
		if w.Code != scenario.status {
			t.Fatalf("Create denied: %d %s", w.Code, w.Body)
		}
		var count int
		if err := db.QueryRow("SELECT count(*) FROM users WHERE username=$1", name).Scan(&count); err != nil || count != 0 {
			t.Fatalf("Denied creation persisted: %v", err)
		}
	}
	w := operationsRequest(r, "POST", "/api/v1/admin/users", body, token)
	if w.Code != 201 {
		t.Fatalf("Create: %d %s", w.Code, w.Body)
	}
	var saved map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &saved); err != nil {
		t.Fatal(err)
	}
	id := saved["id"].(string)
	var hash string
	if err := db.QueryRow("SELECT password_hash FROM users WHERE id=$1", id).Scan(&hash); err != nil {
		t.Fatal(err)
	}
	if hash == password || !auth.VerifyPassword(hash, password) {
		t.Fatal("Password not hashed correctly")
	}
	for _, invalid := range []string{"null", strings.Replace(body, password, "short", 1), strings.Replace(body, "AUDITOR", "NEW_UNAPPROVED_ROLE", 1), strings.Replace(body, "@example.invalid", "invalid", 1)} {
		if response := operationsRequest(r, "POST", "/api/v1/admin/users", invalid, token); response.Code != 400 {
			t.Fatalf("Invalid create accepted: %d %s", response.Code, response.Body)
		}
	}
	if response := operationsRequest(r, "POST", "/api/v1/admin/users", body, token); response.Code != 409 {
		t.Fatal("Duplicate account accepted")
	}
	for _, grant := range []bool{true, false} {
		method, path, payload, action := "POST", "/api/v1/admin/users/"+id+"/permissions", `{"permissionId":"reporting:read"}`, "GRANT_USER_PERMISSION"
		if !grant {
			method = "DELETE"
			path += "/reporting:read"
			payload = ""
			action = "REVOKE_USER_PERMISSION"
		}
		for _, scenario := range []struct {
			r      *gin.Engine
			token  string
			status int
		}{{r, "", 401}, {r, reviewToken, 403}, {auditDenied, token, 503}} {
			response := operationsRequest(scenario.r, method, path, payload, scenario.token)
			if response.Code != scenario.status {
				t.Fatalf("Grant/revoke denial: %d %s", response.Code, response.Body)
			}
			var exists bool
			if err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM user_permissions WHERE user_id=$1 AND permission_id='reporting:read')", id).Scan(&exists); err != nil || exists == grant {
				t.Fatalf("Denied grant/revoke changed state: %v", err)
			}
		}
		response := operationsRequest(r, method, path, payload, token)
		if response.Code != 200 {
			t.Fatalf("Grant/revoke failed: %d %s", response.Code, response.Body)
		}
		var count int
		if err := db.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1 AND user_id=$2 AND action=$3", id, f.user, action).Scan(&count); err != nil || count != 1 {
			t.Fatalf("Audit missing: %v", err)
		}
	}
	for _, viewer := range []string{token, reviewToken} {
		response := operationsRequest(r, "GET", "/api/v1/admin/directory", "", viewer)
		if response.Code != 200 {
			t.Fatalf("Review: %d %s", response.Code, response.Body)
		}
		if strings.Contains(response.Body.String(), "password_hash") || strings.Contains(response.Body.String(), password) || strings.Contains(response.Body.String(), hash) {
			t.Fatal("Directory exposed credentials")
		}
		var directory map[string]interface{}
		if err := json.Unmarshal(response.Body.Bytes(), &directory); err != nil {
			t.Fatal(err)
		}
		if directory["canManage"] != (viewer == token) {
			t.Fatal("Stale token changed ADMIN-only UI capability")
		}
	}
	var details string
	if err := db.QueryRow("SELECT details::text FROM audit_logs WHERE action='CREATE_USER' AND resource_id=$1", id).Scan(&details); err != nil {
		t.Fatal(err)
	}
	if strings.Contains(details, password) || strings.Contains(details, hash) {
		t.Fatal("Audit exposed credentials")
	}
}

func TestAccountResetReactivationAndSessionRevocation(t *testing.T) {
	db := testsupport.OpenDB(t)
	actor := seed(t, db)
	target := seed(t, db)
	reviewer := seed(t, db)
	if _, err := db.Exec("UPDATE users SET role='AUDITOR' WHERE id=$1", reviewer.user); err != nil {
		t.Fatal(err)
	}
	tokens := auth.NewTokenService([]byte("synthetic-session-test-signing-key"))
	mint := func(id string) string {
		t.Helper()
		token, err := tokens.GenerateSession(id, "Synthetic", "ADMIN", "Test", 0, testsupport.SeedMFASession(t, db, id))
		if err != nil {
			t.Fatal(err)
		}
		return token
	}
	actorToken, oldToken, reviewToken := mint(actor.user), mint(target.user), mint(reviewer.user)
	r := adminRouter(db, tokens)
	r.GET("/me", auth.AuthRequired(tokens), auth.RequireActiveSession(db), func(c *gin.Context) { c.Status(200) })
	security, err := auth.NewSecurityHandler(db, tokens, auditlog.NewWriter(db), bytes.Repeat([]byte{42}, 32))
	if err != nil {
		t.Fatal(err)
	}
	r.POST("/login", security.HandleLogin)
	denied := adminRouter(withoutAuditInsert(t, db), tokens)
	snapshot := func() string {
		t.Helper()
		var result string
		if err := db.QueryRow("SELECT json_build_array(password_hash,token_version,is_active)::text FROM users WHERE id=$1", target.user).Scan(&result); err != nil {
			t.Fatal(err)
		}
		return result
	}
	password := "Synthetic replacement passphrase"
	reset := fmt.Sprintf(`{"password":%q,"reason":"Synthetic recovery request"}`, password)
	for _, spec := range []struct{ suffix, body, action string }{{"reset-password", reset, "RESET_PASSWORD"}, {"reactivate", `{"reason":"Synthetic reactivation approval"}`, "REACTIVATE_USER"}} {
		if spec.suffix == "reactivate" {
			if _, err := db.Exec("UPDATE users SET is_active=false WHERE id=$1", target.user); err != nil {
				t.Fatal(err)
			}
		}
		path := "/api/v1/admin/users/" + target.user + "/" + spec.suffix
		before := snapshot()
		for _, scenario := range []struct {
			router *gin.Engine
			token  string
			status int
		}{{r, "", 401}, {r, reviewToken, 403}, {denied, actorToken, 503}} {
			w := operationsRequest(scenario.router, "POST", path, spec.body, scenario.token)
			if w.Code != scenario.status {
				t.Fatalf("%s: want %d got %d %s", spec.suffix, scenario.status, w.Code, w.Body)
			}
			if snapshot() != before {
				t.Fatal("Rejected/unaudited operation changed credentials or sessions")
			}
		}
		for _, body := range []string{"null", "{}", `{"reason":""}`, `{"reason":"Synthetic","token_version":0}`} {
			w := operationsRequest(r, "POST", path, body, actorToken)
			if w.Code != 400 {
				t.Fatalf("Invalid body: %d %s", w.Code, w.Body)
			}
		}
		w := operationsRequest(r, "POST", path, spec.body, actorToken)
		if w.Code != 200 {
			t.Fatalf("Account update: %d %s", w.Code, w.Body)
		}
		for _, endpoint := range []string{"/me", "/api/v1/admin/directory"} {
			if response := operationsRequest(r, "GET", endpoint, "", oldToken); response.Code != 401 {
				t.Fatalf("Revoked login accepted: %d %s", response.Code, response.Body)
			}
		}
		var username, hash string
		var version int
		var active bool
		if err := db.QueryRow("SELECT username,password_hash,token_version,is_active FROM users WHERE id=$1", target.user).Scan(&username, &hash, &version, &active); err != nil {
			t.Fatal(err)
		}
		if !active || !auth.VerifyPassword(hash, password) {
			t.Fatal("Updated account credentials/state incorrect")
		}
		login := operationsRequest(r, "POST", "/login", fmt.Sprintf(`{"username":%q,"password":%q,"code":%q}`, username, password, testsupport.SeedRecoveryCode(t, db, target.user)), "")
		if login.Code != 200 {
			t.Fatalf("Fresh login failed: %d %s", login.Code, login.Body)
		}
		var response auth.LoginResponse
		if err := json.Unmarshal(login.Body.Bytes(), &response); err != nil {
			t.Fatal(err)
		}
		claims, err := tokens.Validate(response.Token)
		if err != nil || claims.TokenVersion != version {
			t.Fatalf("Login did not use stored generation: %v", err)
		}
		if w := operationsRequest(r, "GET", "/me", "", response.Token); w.Code != 200 {
			t.Fatal("Fresh session rejected")
		}
		oldToken = response.Token // The reactivation must also invalidate this non-zero generation.
		var details string
		if err := db.QueryRow("SELECT details::text FROM audit_logs WHERE resource_id=$1 AND action=$2", target.user, spec.action).Scan(&details); err != nil {
			t.Fatal(err)
		}
		if strings.Contains(details, password) || strings.Contains(details, hash) {
			t.Fatal("Audit exposed password")
		}
	}
	if w := operationsRequest(r, "POST", "/api/v1/admin/users/"+target.user+"/reactivate", `{"reason":"Already active"}`, actorToken); w.Code != 409 {
		t.Fatal("Already active reactivation accepted")
	}
	if _, err := db.Exec("UPDATE users SET is_active=false WHERE id=$1", target.user); err != nil {
		t.Fatal(err)
	}
	if w := operationsRequest(r, "POST", "/api/v1/admin/users/"+target.user+"/reset-password", reset, actorToken); w.Code != 200 {
		t.Fatal("Inactive password reset failed")
	}
	var active bool
	if err := db.QueryRow("SELECT is_active FROM users WHERE id=$1", target.user).Scan(&active); err != nil || active {
		t.Fatal("Password reset activated account")
	}
	// Resetting one's own account revokes the calling administrator too.
	if w := operationsRequest(r, "POST", "/api/v1/admin/users/"+actor.user+"/reset-password", reset, actorToken); w.Code != 200 {
		t.Fatalf("Self reset: %d %s", w.Code, w.Body)
	}
	if w := operationsRequest(r, "GET", "/api/v1/admin/directory", "", actorToken); w.Code != 401 {
		t.Fatal("Self-reset session remained valid")
	}
}
