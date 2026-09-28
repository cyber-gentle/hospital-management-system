package auth

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gin-gonic/gin"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func TestAuthRequiredMiddleware(t *testing.T) {
	router := gin.New()
	router.GET("/protected", AuthRequired(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// 1. Missing header -> 401
	reqMissing, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	wMissing := httptest.NewRecorder()
	router.ServeHTTP(wMissing, reqMissing)
	if wMissing.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for missing header, got %d", wMissing.Code)
	}

	// 2. Valid token -> 200
	token, _ := GenerateToken("usr_1", "nurse_mary", "NURSE", "ICU")
	reqValid, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	reqValid.Header.Set("Authorization", "Bearer "+token)
	wValid := httptest.NewRecorder()
	router.ServeHTTP(wValid, reqValid)
	if wValid.Code != http.StatusOK {
		t.Errorf("expected 200 for valid token, got %d", wValid.Code)
	}
}

func TestRequireRoleMiddleware(t *testing.T) {
	router := gin.New()
	router.GET("/doctor-only", AuthRequired(), RequireRole("DOCTOR"), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "access_granted"})
	})

	// Nurse attempting to access doctor route -> 403
	nurseToken, _ := GenerateToken("usr_nurse", "nurse_joy", "NURSE", "General")
	reqNurse, _ := http.NewRequest(http.MethodGet, "/doctor-only", nil)
	reqNurse.Header.Set("Authorization", "Bearer "+nurseToken)
	wNurse := httptest.NewRecorder()
	router.ServeHTTP(wNurse, reqNurse)
	if wNurse.Code != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden for NURSE on doctor route, got %d", wNurse.Code)
	}

	// Doctor accessing doctor route -> 200
	doctorToken, _ := GenerateToken("usr_doc", "dr_house", "DOCTOR", "Diagnostics")
	reqDoctor, _ := http.NewRequest(http.MethodGet, "/doctor-only", nil)
	reqDoctor.Header.Set("Authorization", "Bearer "+doctorToken)
	wDoctor := httptest.NewRecorder()
	router.ServeHTTP(wDoctor, reqDoctor)
	if wDoctor.Code != http.StatusOK {
		t.Errorf("expected 200 OK for DOCTOR on doctor route, got %d", wDoctor.Code)
	}

	// Admin accessing doctor route -> 200 (admin override)
	adminToken, _ := GenerateToken("usr_admin", "admin_root", "ADMIN", "IT")
	reqAdmin, _ := http.NewRequest(http.MethodGet, "/doctor-only", nil)
	reqAdmin.Header.Set("Authorization", "Bearer "+adminToken)
	wAdmin := httptest.NewRecorder()
	router.ServeHTTP(wAdmin, reqAdmin)
	if wAdmin.Code != http.StatusOK {
		t.Errorf("expected 200 OK for ADMIN override, got %d", wAdmin.Code)
	}
}

func TestInternalServiceAuthRequired(t *testing.T) {
	os.Setenv("INTERNAL_SERVICE_KEY", "test_internal_secret")
	defer os.Unsetenv("INTERNAL_SERVICE_KEY")

	router := gin.New()
	router.POST("/internal/test", InternalServiceAuthRequired(), func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "internal_ok"})
	})

	// Missing secret -> 401
	reqUnauthorized, _ := http.NewRequest(http.MethodPost, "/internal/test", nil)
	wUnauthorized := httptest.NewRecorder()
	router.ServeHTTP(wUnauthorized, reqUnauthorized)
	if wUnauthorized.Code != http.StatusUnauthorized {
		t.Errorf("expected 401 for unauthorized internal call, got %d", wUnauthorized.Code)
	}

	// Valid secret -> 200
	reqAuthorized, _ := http.NewRequest(http.MethodPost, "/internal/test", nil)
	reqAuthorized.Header.Set("X-Internal-Service-Key", "test_internal_secret")
	wAuthorized := httptest.NewRecorder()
	router.ServeHTTP(wAuthorized, reqAuthorized)
	if wAuthorized.Code != http.StatusOK {
		t.Errorf("expected 200 for authorized internal call, got %d", wAuthorized.Code)
	}
}
