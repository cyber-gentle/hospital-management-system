package internalapi

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestAuthzCheckEndpoint(t *testing.T) {
	os.Setenv("INTERNAL_SERVICE_KEY", "test_internal_key")
	defer os.Unsetenv("INTERNAL_SERVICE_KEY")

	handler := NewHandler(nil, nil)
	router := gin.New()
	handler.RegisterRoutes(router)

	// 1. Missing X-Internal-Service-Key -> 401
	reqUnauth, _ := http.NewRequest(http.MethodGet, "/internal/authz/check?role=DOCTOR&module=laboratory&action=order", nil)
	wUnauth := httptest.NewRecorder()
	router.ServeHTTP(wUnauth, reqUnauth)
	if wUnauth.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401 Unauthorized for missing internal key, got %d", wUnauth.Code)
	}

	// 2. Authorized Doctor checking laboratory module -> 200 Allowed
	reqAllowed, _ := http.NewRequest(http.MethodGet, "/internal/authz/check?role=DOCTOR&module=laboratory&action=order", nil)
	reqAllowed.Header.Set("X-Internal-Service-Key", "test_internal_key")
	wAllowed := httptest.NewRecorder()
	router.ServeHTTP(wAllowed, reqAllowed)
	if wAllowed.Code != http.StatusOK {
		t.Fatalf("expected 200 OK for authorized check, got %d", wAllowed.Code)
	}

	var resAllowed map[string]interface{}
	_ = json.Unmarshal(wAllowed.Body.Bytes(), &resAllowed)
	if resAllowed["allowed"] != true {
		t.Errorf("expected allowed=true for DOCTOR on laboratory, got %v", resAllowed["allowed"])
	}

	// 3. Nurse checking laboratory order -> 200 Not Allowed
	reqDenied, _ := http.NewRequest(http.MethodGet, "/internal/authz/check?role=NURSE&module=laboratory&action=order", nil)
	reqDenied.Header.Set("X-Internal-Service-Key", "test_internal_key")
	wDenied := httptest.NewRecorder()
	router.ServeHTTP(wDenied, reqDenied)
	if wDenied.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d", wDenied.Code)
	}

	var resDenied map[string]interface{}
	_ = json.Unmarshal(wDenied.Body.Bytes(), &resDenied)
	if resDenied["allowed"] != false {
		t.Errorf("expected allowed=false for NURSE on laboratory, got %v", resDenied["allowed"])
	}
}

func TestAuditLogEndpointAuthGuard(t *testing.T) {
	os.Setenv("INTERNAL_SERVICE_KEY", "test_internal_key")
	defer os.Unsetenv("INTERNAL_SERVICE_KEY")

	handler := NewHandler(nil, nil)
	router := gin.New()
	handler.RegisterRoutes(router)

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
}
