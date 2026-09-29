package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
)

const (
	testUsername = "nurse_mary"
	testPassword = "correct-horse-battery-staple"
)

// testPasswordHash is computed once so the suite pays the bcrypt cost of 12 a
// single time rather than once per test case.
var testPasswordHash = sync.OnceValue(func() string {
	hash, err := HashPassword(testPassword)
	if err != nil {
		panic("failed to hash test password: " + err.Error())
	}
	return hash
})

type fakeUserStore struct {
	users map[string]*User
	err   error
}

func (f *fakeUserStore) FindByUsername(_ context.Context, username string) (*User, error) {
	if f.err != nil {
		return nil, f.err
	}
	user, ok := f.users[username]
	if !ok {
		return nil, ErrUserNotFound
	}
	return user, nil
}

type recordingAuditor struct {
	mu      sync.Mutex
	entries []auditlog.Entry
}

func (r *recordingAuditor) Record(_ context.Context, entry auditlog.Entry) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.entries = append(r.entries, entry)
	return nil
}

func (r *recordingAuditor) all() []auditlog.Entry {
	r.mu.Lock()
	defer r.mu.Unlock()
	return append([]auditlog.Entry(nil), r.entries...)
}

func newTestRouter(handler *LoginHandler) *gin.Engine {
	router := gin.New()
	router.POST("/api/v1/auth/login", handler.Handle)
	return router
}

func postLogin(t *testing.T, router *gin.Engine, body string) *httptest.ResponseRecorder {
	t.Helper()
	req, err := http.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBufferString(body))
	if err != nil {
		t.Fatalf("failed to build request: %v", err)
	}
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

func newHandler(store UserStore, auditor AuditRecorder) (*LoginHandler, *TokenService) {
	tokens := testTokenService()
	return NewLoginHandler(store, tokens, auditor), tokens
}

func TestLoginSucceedsWithValidCredentials(t *testing.T) {
	auditor := &recordingAuditor{}
	handler, tokens := newHandler(&fakeUserStore{users: map[string]*User{
		testUsername: {
			ID:           "usr_nurse_01",
			Username:     testUsername,
			PasswordHash: testPasswordHash(),
			Role:         "NURSE",
			Department:   "ICU",
			IsActive:     true,
		},
	}}, auditor)

	w := postLogin(t, newTestRouter(handler), `{"username":"nurse_mary","password":"correct-horse-battery-staple"}`)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (body: %s)", w.Code, w.Body.String())
	}

	var resp LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	claims, err := tokens.Validate(resp.Token)
	if err != nil {
		t.Fatalf("issued token failed validation: %v", err)
	}
	if claims.Role != "NURSE" || claims.Department != "ICU" || claims.UserID != "usr_nurse_01" {
		t.Errorf("token claims do not reflect the stored user: %+v", *claims)
	}

	entries := auditor.all()
	if len(entries) != 1 || entries[0].Action != "LOGIN_SUCCESS" || entries[0].Status != "SUCCESS" {
		t.Errorf("expected one successful audit entry, got %+v", entries)
	}
}

// The regression guard for the original vulnerability. A request that carries
// a role field must not influence the issued token: the role comes from the
// stored user record. Before the fix this exact payload returned an ADMIN token.
func TestLoginIgnoresClientSuppliedRole(t *testing.T) {
	auditor := &recordingAuditor{}
	handler, tokens := newHandler(&fakeUserStore{users: map[string]*User{
		testUsername: {
			ID:           "usr_nurse_01",
			Username:     testUsername,
			PasswordHash: testPasswordHash(),
			Role:         "NURSE",
			Department:   "ICU",
			IsActive:     true,
		},
	}}, auditor)

	w := postLogin(t, newTestRouter(handler),
		`{"username":"nurse_mary","password":"correct-horse-battery-staple","role":"ADMIN"}`)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d (body: %s)", w.Code, w.Body.String())
	}

	var resp LoginResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.User.Role != "NURSE" {
		t.Errorf("response role: expected NURSE from the stored record, got %q", resp.User.Role)
	}

	claims, err := tokens.Validate(resp.Token)
	if err != nil {
		t.Fatalf("issued token failed validation: %v", err)
	}
	if claims.Role != "NURSE" {
		t.Fatalf("privilege escalation: token carries role %q, expected NURSE", claims.Role)
	}
}

func TestLoginRejectsWrongPassword(t *testing.T) {
	auditor := &recordingAuditor{}
	handler, _ := newHandler(&fakeUserStore{users: map[string]*User{
		testUsername: {
			ID:           "usr_nurse_01",
			Username:     testUsername,
			PasswordHash: testPasswordHash(),
			Role:         "NURSE",
			Department:   "ICU",
			IsActive:     true,
		},
	}}, auditor)

	w := postLogin(t, newTestRouter(handler), `{"username":"nurse_mary","password":"wrong-password"}`)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", w.Code)
	}
	if bytes.Contains(w.Body.Bytes(), []byte("token")) {
		t.Error("a failed login must not return a token")
	}

	entries := auditor.all()
	if len(entries) != 1 || entries[0].Action != "LOGIN_FAILURE" || entries[0].Status != "FAILURE" {
		t.Errorf("expected one failure audit entry, got %+v", entries)
	}
}

func TestLoginRejectsInactiveUser(t *testing.T) {
	auditor := &recordingAuditor{}
	handler, _ := newHandler(&fakeUserStore{users: map[string]*User{
		testUsername: {
			ID:           "usr_nurse_01",
			Username:     testUsername,
			PasswordHash: testPasswordHash(),
			Role:         "NURSE",
			Department:   "ICU",
			IsActive:     false,
		},
	}}, auditor)

	// Correct password, deactivated account.
	w := postLogin(t, newTestRouter(handler), `{"username":"nurse_mary","password":"correct-horse-battery-staple"}`)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 for a deactivated account, got %d", w.Code)
	}
}

// The response for an unknown username must be byte-identical to the response
// for a wrong password, so the endpoint cannot be used to enumerate accounts.
func TestLoginDoesNotRevealWhetherUserExists(t *testing.T) {
	handler, _ := newHandler(&fakeUserStore{users: map[string]*User{
		testUsername: {
			ID:           "usr_nurse_01",
			Username:     testUsername,
			PasswordHash: testPasswordHash(),
			Role:         "NURSE",
			Department:   "ICU",
			IsActive:     true,
		},
	}}, &recordingAuditor{})

	router := newTestRouter(handler)
	unknownUser := postLogin(t, router, `{"username":"no_such_person","password":"whatever"}`)
	wrongPassword := postLogin(t, router, `{"username":"nurse_mary","password":"whatever"}`)

	if unknownUser.Code != wrongPassword.Code {
		t.Errorf("status differs: unknown user %d vs wrong password %d", unknownUser.Code, wrongPassword.Code)
	}
	if unknownUser.Body.String() != wrongPassword.Body.String() {
		t.Errorf("body differs:\n unknown user: %s\n wrong password: %s", unknownUser.Body.String(), wrongPassword.Body.String())
	}
}

func TestLoginFailsClosedWithoutUserStore(t *testing.T) {
	handler, _ := newHandler(nil, &recordingAuditor{})

	w := postLogin(t, newTestRouter(handler), `{"username":"nurse_mary","password":"whatever"}`)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when no user store is configured, got %d", w.Code)
	}
}

func TestLoginRejectsMalformedRequest(t *testing.T) {
	handler, _ := newHandler(&fakeUserStore{}, &recordingAuditor{})
	router := newTestRouter(handler)

	cases := map[string]string{
		"missing password": `{"username":"nurse_mary"}`,
		"missing username": `{"password":"whatever"}`,
		"empty body":       `{}`,
	}

	for name, body := range cases {
		t.Run(name, func(t *testing.T) {
			if w := postLogin(t, router, body); w.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d", w.Code)
			}
		})
	}
}

// A store failure is an infrastructure problem, not a credential problem, and
// must not be reported as 401 (which would tell a caller their password was
// wrong when the database is simply unreachable).
func TestLoginReportsStoreFailureAsServerError(t *testing.T) {
	handler, _ := newHandler(&fakeUserStore{err: context.DeadlineExceeded}, &recordingAuditor{})

	w := postLogin(t, newTestRouter(handler), `{"username":"nurse_mary","password":"whatever"}`)

	if w.Code != http.StatusInternalServerError {
		t.Fatalf("expected 500 for a store failure, got %d", w.Code)
	}
}

func TestHashAndVerifyPassword(t *testing.T) {
	hash, err := HashPassword("a-reasonable-password")
	if err != nil {
		t.Fatalf("expected hashing to succeed, got %v", err)
	}
	if hash == "a-reasonable-password" {
		t.Fatal("password was stored in plaintext")
	}
	if !VerifyPassword(hash, "a-reasonable-password") {
		t.Error("expected the correct password to verify")
	}
	if VerifyPassword(hash, "a-different-password") {
		t.Error("expected a wrong password to fail verification")
	}
	if VerifyPassword("", "a-reasonable-password") {
		t.Error("an empty hash must never verify")
	}

	if _, err := HashPassword(""); err == nil {
		t.Error("expected an empty password to be rejected")
	}
	if _, err := HashPassword(string(make([]byte, 73))); err == nil {
		t.Error("expected a password beyond bcrypt's limit to be rejected rather than truncated")
	}
}
