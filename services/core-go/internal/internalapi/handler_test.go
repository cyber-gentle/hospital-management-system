package internalapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

const testInternalKey = "test_internal_key"

func newTestRouter() *gin.Engine {
	// A nil db exercises the fail-closed path; a nil audit writer exercises the
	// unavailable path.
	handler := NewHandler(nil, nil)
	router := gin.New()
	handler.RegisterRoutes(router, testInternalKey)
	return router
}

func TestAuthzCheckRequiresTheInternalKey(t *testing.T) {
	router := newTestRouter()

	req, _ := http.NewRequest(http.MethodGet, "/internal/authz/check?role=DOCTOR&module=laboratory&action=order", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for missing internal key, got %d", w.Code)
	}
}

// With no database there is no authority to consult, so the endpoint must
// refuse rather than answer. It previously fell back to a hard-coded copy of
// the permission matrix; that fallback is gone (see the handler comment), and
// this test is what stops it being reintroduced.
func TestAuthzCheckFailsClosedWithoutADatabase(t *testing.T) {
	router := newTestRouter()

	// ADMIN is deliberately absent here: its universal access is a static
	// override that needs no lookup, so it is answered even with no database
	// (pinned by TestAuthzCheckAdminOverride). Every role that *does* need the
	// permission matrix must get no decision at all.
	for _, role := range []string{"DOCTOR", "NURSE", "PHARMACIST", "AUDITOR"} {
		req, _ := http.NewRequest(http.MethodGet,
			"/internal/authz/check?role="+role+"&module=laboratory&action=order", nil)
		req.Header.Set("X-Internal-Service-Key", testInternalKey)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("role %s: expected 503 when no permission authority is available, got %d (body %s)",
				role, w.Code, w.Body.String())
		}

		var body map[string]interface{}
		_ = json.Unmarshal(w.Body.Bytes(), &body)
		if _, answered := body["allowed"]; answered {
			t.Errorf("role %s: response carried an `allowed` decision with no authority to base it on: %s",
				role, w.Body.String())
		}
	}
}

func TestAuthzCheckRejectsMissingParameters(t *testing.T) {
	router := newTestRouter()

	req, _ := http.NewRequest(http.MethodGet, "/internal/authz/check?role=DOCTOR", nil)
	req.Header.Set("X-Internal-Service-Key", testInternalKey)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for incomplete query parameters, got %d", w.Code)
	}
}

func TestAuditLogEndpointAuthGuard(t *testing.T) {
	router := newTestRouter()

	payload := AuditLogRequest{
		Module:       "laboratory",
		Action:       "CREATE_TEST",
		ResourceType: "LabTest",
		ResourceID:   "tst_01",
	}
	body, _ := json.Marshal(payload)

	// Missing secret header -> 401
	req, _ := http.NewRequest(http.MethodPost, "/internal/audit-log", bytes.NewReader(body))
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for audit log without service key, got %d", w.Code)
	}

	// Wrong secret header -> 401
	reqWrong, _ := http.NewRequest(http.MethodPost, "/internal/audit-log", bytes.NewReader(body))
	reqWrong.Header.Set("X-Internal-Service-Key", "not_the_key")
	wWrong := httptest.NewRecorder()
	router.ServeHTTP(wWrong, reqWrong)
	if wWrong.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for a wrong service key, got %d", wWrong.Code)
	}
}

// An authenticated call that reaches a handler with no writer must not panic.
func TestAuditLogEndpointUnavailableWithoutWriter(t *testing.T) {
	router := newTestRouter()

	payload := AuditLogRequest{
		Module:       "laboratory",
		Action:       "CREATE_TEST",
		ResourceType: "LabTest",
		ResourceID:   "tst_01",
	}
	body, _ := json.Marshal(payload)

	req, _ := http.NewRequest(http.MethodPost, "/internal/audit-log", bytes.NewReader(body))
	req.Header.Set("X-Internal-Service-Key", testInternalKey)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when the audit writer is unavailable, got %d", w.Code)
	}
}
