package pharmacy_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/modules/pharmacy"
	"hospital-hims/services/core-go/internal/testsupport"
)

func TestPharmacyEndpoints(t *testing.T) {
	db := testsupport.OpenDB(t)

	// Seed user and generate token
	var userID string
	err := db.QueryRow(`
		INSERT INTO users (username, email, password_hash, first_name, last_name, role, department)
		VALUES ($1, $2, 'hash', 'Test', 'User', 'PHARMACIST', 'PHARMACY')
		RETURNING id
	`, testsupport.UniqueID("rx_user"), testsupport.UniqueID("rx_email")).Scan(&userID)
	if err != nil {
		t.Fatal(err)
	}

	// Grant permission
	_, err = db.Exec(`
		INSERT INTO permissions (id, module, action, description) 
		VALUES ('pharmacy:read', 'pharmacy', 'read', 'Test'), ('pharmacy:write', 'pharmacy', 'write', 'Test')
		ON CONFLICT (id) DO NOTHING
	`)
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Exec(`
		INSERT INTO role_permissions (role, permission_id) 
		VALUES ('PHARMACIST', 'pharmacy:read'), ('PHARMACIST', 'pharmacy:write')
		ON CONFLICT DO NOTHING
	`)
	if err != nil {
		t.Fatal(err)
	}

	tokens := auth.NewTokenService([]byte("test-secret"))
	token, _ := tokens.Generate(userID, "Test", "PHARMACIST", "PHARMACY")

	// Setup Router
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api/v1")
	writer := auditlog.NewWriter(db)
	pharmacy.NewHandler(db, writer, tokens).RegisterRoutes(api)

	t.Run("GetStock_Empty", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/pharmacy/drugs/stock", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("expected 200 OK, got %d", w.Code)
		}
	})
}
