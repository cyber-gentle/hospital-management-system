package accounting_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/modules/accounting"
	"hospital-hims/services/core-go/internal/testsupport"
)

func TestAccountingEndpoints(t *testing.T) {
	db := testsupport.OpenDB(t)

	// Seed user and generate token
	var userID string
	err := db.QueryRow(`
		INSERT INTO users (username, email, password_hash, first_name, last_name, role, department)
		VALUES ($1, $2, 'hash', 'Test', 'Accountant', 'ACCOUNTANT', 'FINANCE')
		RETURNING id
	`, testsupport.UniqueID("acc_user"), testsupport.UniqueID("acc_email")).Scan(&userID)
	if err != nil {
		t.Fatal(err)
	}

	// Grant permission
	_, err = db.Exec(`
		INSERT INTO permissions (id, module, action, description) 
		VALUES ('accounting:read', 'accounting', 'read', 'Test'), ('accounting:write', 'accounting', 'write', 'Test')
		ON CONFLICT (id) DO NOTHING
	`)
	if err != nil {
		t.Fatal(err)
	}
	_, err = db.Exec(`
		INSERT INTO role_permissions (role, permission_id) 
		VALUES ('ACCOUNTANT', 'accounting:read'), ('ACCOUNTANT', 'accounting:write')
		ON CONFLICT DO NOTHING
	`)
	if err != nil {
		t.Fatal(err)
	}

	tokens := auth.NewTokenService([]byte("test-secret"))
	token, _ := tokens.Generate(userID, "Test", "ACCOUNTANT", "FINANCE")

	// Setup Router
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api/v1")
	writer := auditlog.NewWriter(db)
	accounting.NewHandler(db, writer, tokens).RegisterRoutes(api)

	t.Run("GetAccounts_Empty", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/v1/accounting/accounts", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusOK {
			t.Errorf("expected 200 OK, got %d", w.Code)
		}
	})
}
