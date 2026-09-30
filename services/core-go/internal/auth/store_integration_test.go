package auth

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/testsupport"
)

// This file exercises the user store — and the login path built on it — against
// a real PostgreSQL instance. The store's SQL is the one piece of the C1 fix
// that a unit test cannot cover: a column typo or a wrong WHERE clause would
// pass every mocked test and still authenticate the wrong person, or nobody.

// seedUser inserts a user and returns their username. The row is soft-deleted
// on cleanup rather than removed, matching the codebase-wide soft-delete rule.
func seedUser(t *testing.T, db *sql.DB, opts seedOptions) string {
	t.Helper()
	ctx := context.Background()

	username := testsupport.UniqueID(opts.prefix)

	role := opts.role
	if role == "" {
		role = "NURSE"
	}
	department := opts.department
	if department == "" {
		department = "General Ward"
	}

	hash, err := HashPassword(opts.password)
	if err != nil {
		t.Fatalf("failed to hash the fixture password: %v", err)
	}

	const insert = `
		INSERT INTO users (username, email, password_hash, first_name, last_name,
		                   role, department, is_active, deleted_at)
		VALUES ($1, $2, $3, 'Test', 'Fixture', $4, $5, $6, $7)`

	_, err = db.ExecContext(ctx, insert,
		username, username+"@example.test", hash, role, department,
		!opts.inactive, opts.deletedAt,
	)
	if err != nil {
		t.Fatalf("failed to insert the user fixture: %v", err)
	}

	t.Cleanup(func() {
		_, err := db.ExecContext(context.Background(),
			`UPDATE users SET deleted_at = NOW() WHERE username = $1`, username)
		if err != nil {
			t.Errorf("failed to soft-delete the user fixture: %v", err)
		}
	})

	return username
}

type seedOptions struct {
	prefix     string
	password   string
	role       string
	department string
	inactive   bool
	deletedAt  *string
}

func TestPostgresUserStoreFindByUsername(t *testing.T) {
	db := testsupport.OpenDB(t)
	store := NewPostgresUserStore(db)
	ctx := context.Background()

	username := seedUser(t, db, seedOptions{
		prefix:     "nurse",
		password:   "correct horse battery staple",
		role:       "NURSE",
		department: "ICU",
	})

	user, err := store.FindByUsername(ctx, username)
	if err != nil {
		t.Fatalf("FindByUsername returned an error for an existing user: %v", err)
	}

	if user.Username != username {
		t.Errorf("username: got %q, want %q", user.Username, username)
	}
	if user.Role != "NURSE" {
		t.Errorf("role: got %q, want %q", user.Role, "NURSE")
	}
	if user.Department != "ICU" {
		t.Errorf("department: got %q, want %q", user.Department, "ICU")
	}
	if !user.IsActive {
		t.Error("is_active: got false, want true")
	}
	if user.ID == "" {
		t.Error("id was not populated")
	}
	// The stored hash must be the bcrypt hash of the password, not the password.
	if user.PasswordHash == "correct horse battery staple" {
		t.Fatal("password_hash holds the plaintext password")
	}
	if !VerifyPassword(user.PasswordHash, "correct horse battery staple") {
		t.Error("stored hash does not verify against the fixture password")
	}
}

func TestPostgresUserStoreUnknownUsername(t *testing.T) {
	db := testsupport.OpenDB(t)
	store := NewPostgresUserStore(db)

	_, err := store.FindByUsername(context.Background(), testsupport.UniqueID("nobody"))
	if !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("got %v, want ErrUserNotFound", err)
	}
}

// A user removed through the soft-delete pattern must not be able to log in.
func TestPostgresUserStoreExcludesSoftDeletedUsers(t *testing.T) {
	db := testsupport.OpenDB(t)
	store := NewPostgresUserStore(db)

	deletedAt := "2026-01-01T00:00:00Z"
	username := seedUser(t, db, seedOptions{
		prefix:    "departed",
		password:  "correct horse battery staple",
		deletedAt: &deletedAt,
	})

	_, err := store.FindByUsername(context.Background(), username)
	if !errors.Is(err, ErrUserNotFound) {
		t.Fatalf("got %v, want ErrUserNotFound for a soft-deleted user", err)
	}
}

// A deactivated user is still returned by the store. The store reports the
// record as it is; refusing the login is the handler's decision, and the handler
// needs to see is_active=false to make it (and to distinguish "deactivated" from
// "no such user" for the audit entry).
func TestPostgresUserStoreReturnsInactiveUserWithFlag(t *testing.T) {
	db := testsupport.OpenDB(t)
	store := NewPostgresUserStore(db)

	username := seedUser(t, db, seedOptions{
		prefix:   "suspended",
		password: "correct horse battery staple",
		inactive: true,
	})

	user, err := store.FindByUsername(context.Background(), username)
	if err != nil {
		t.Fatalf("FindByUsername returned an error for an inactive user: %v", err)
	}
	if user.IsActive {
		t.Error("is_active: got true, want false")
	}
}

// The end-to-end version of the C1 fix: real SQL, real bcrypt, real handler.
// The unit test in login_test.go proves the handler ignores a client-supplied
// role against a stubbed store; this proves the same holds when the role comes
// out of an actual users table.
func TestLoginAgainstRealDatabase(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testsupport.OpenDB(t)

	store := NewPostgresUserStore(db)
	tokens := NewTokenService([]byte("integration_test_secret_at_least_32_bytes"))
	handler := NewLoginHandler(store, tokens, nil)

	username := seedUser(t, db, seedOptions{
		prefix:     "doctor",
		password:   "correct horse battery staple",
		role:       "DOCTOR",
		department: "Paediatrics",
	})

	router := gin.New()
	router.POST("/api/v1/auth/login", handler.Handle)

	post := func(t *testing.T, body map[string]string) *httptest.ResponseRecorder {
		t.Helper()
		payload, err := json.Marshal(body)
		if err != nil {
			t.Fatalf("failed to encode the request body: %v", err)
		}
		req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(payload))
		req.Header.Set("Content-Type", "application/json")
		rec := httptest.NewRecorder()
		router.ServeHTTP(rec, req)
		return rec
	}

	t.Run("valid credentials issue a token carrying the stored role", func(t *testing.T) {
		rec := post(t, map[string]string{
			"username": username,
			"password": "correct horse battery staple",
		})
		if rec.Code != http.StatusOK {
			t.Fatalf("status: got %d, want 200 (body: %s)", rec.Code, rec.Body.String())
		}

		var resp struct {
			Token string `json:"token"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode the response: %v", err)
		}
		if resp.Token == "" {
			t.Fatal("no token was returned")
		}

		claims, err := tokens.Validate(resp.Token)
		if err != nil {
			t.Fatalf("issued token does not validate: %v", err)
		}
		if claims.Role != "DOCTOR" {
			t.Errorf("token role: got %q, want %q", claims.Role, "DOCTOR")
		}
		if claims.Department != "Paediatrics" {
			t.Errorf("token department: got %q, want %q", claims.Department, "Paediatrics")
		}
		if claims.Username != username {
			t.Errorf("token username: got %q, want %q", claims.Username, username)
		}
	})

	t.Run("a client-supplied admin role is ignored", func(t *testing.T) {
		rec := post(t, map[string]string{
			"username": username,
			"password": "correct horse battery staple",
			"role":     "ADMIN",
		})
		if rec.Code != http.StatusOK {
			t.Fatalf("status: got %d, want 200 (body: %s)", rec.Code, rec.Body.String())
		}

		var resp struct {
			Token string `json:"token"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
			t.Fatalf("failed to decode the response: %v", err)
		}

		claims, err := tokens.Validate(resp.Token)
		if err != nil {
			t.Fatalf("issued token does not validate: %v", err)
		}
		if claims.Role != "DOCTOR" {
			t.Fatalf("role escalation: token role is %q, want %q", claims.Role, "DOCTOR")
		}
	})

	t.Run("a wrong password is rejected", func(t *testing.T) {
		rec := post(t, map[string]string{
			"username": username,
			"password": "not the right password",
		})
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("status: got %d, want 401 (body: %s)", rec.Code, rec.Body.String())
		}
		if bytes.Contains(rec.Body.Bytes(), []byte("token")) {
			t.Errorf("a token was returned for a wrong password: %s", rec.Body.String())
		}
	})

	t.Run("an unknown user is rejected identically", func(t *testing.T) {
		rec := post(t, map[string]string{
			"username": testsupport.UniqueID("ghost"),
			"password": "correct horse battery staple",
		})
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("status: got %d, want 401 (body: %s)", rec.Code, rec.Body.String())
		}
	})

	t.Run("a deactivated user is rejected", func(t *testing.T) {
		inactive := seedUser(t, db, seedOptions{
			prefix:   "suspended",
			password: "correct horse battery staple",
			inactive: true,
		})
		rec := post(t, map[string]string{
			"username": inactive,
			"password": "correct horse battery staple",
		})
		if rec.Code != http.StatusUnauthorized {
			t.Errorf("status: got %d, want 401 (body: %s)", rec.Code, rec.Body.String())
		}
	})
}

// The login handler writes a FAILURE audit entry for a rejected attempt. That
// entry goes through business logic the unit tests stub out, so it is only
// really verified here.
func TestLoginWritesAuditEntryForRejectedAttempt(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db := testsupport.OpenDB(t)

	store := NewPostgresUserStore(db)
	tokens := NewTokenService([]byte("integration_test_secret_at_least_32_bytes"))
	auditWriter := auditlog.NewWriter(db)
	handler := NewLoginHandler(store, tokens, auditWriter)

	username := seedUser(t, db, seedOptions{
		prefix:   "audited",
		password: "correct horse battery staple",
	})

	router := gin.New()
	router.POST("/api/v1/auth/login", handler.Handle)

	payload, err := json.Marshal(map[string]string{
		"username": username,
		"password": "not the right password",
	})
	if err != nil {
		t.Fatalf("failed to encode the request body: %v", err)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("status: got %d, want 401 (body: %s)", rec.Code, rec.Body.String())
	}

	var (
		module     string
		action     string
		status     string
		resourceID string
	)
	err = db.QueryRowContext(context.Background(), `
		SELECT module, action, status, resource_id
		FROM audit_logs
		WHERE action = 'LOGIN_FAILURE' AND resource_id = $1
		ORDER BY timestamp DESC
		LIMIT 1`, username,
	).Scan(&module, &action, &status, &resourceID)
	if errors.Is(err, sql.ErrNoRows) {
		t.Fatal("no audit entry was written for the rejected login attempt")
	}
	if err != nil {
		t.Fatalf("failed to read the audit entry: %v", err)
	}

	if module != "auth" {
		t.Errorf("module: got %q, want %q", module, "auth")
	}
	if status != "FAILURE" {
		t.Errorf("status: got %q, want %q", status, "FAILURE")
	}
}
