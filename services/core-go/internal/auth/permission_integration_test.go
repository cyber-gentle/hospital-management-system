package auth

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/testsupport"
)

func TestPermissionGuardFailsClosedAndPreservesAdmin(t *testing.T) {
	for _, tc := range []struct {
		name, user, role string
		status           int
	}{
		{"anonymous", "", "", http.StatusUnauthorized},
		{"unavailable", "synthetic", "NURSE", http.StatusServiceUnavailable},
		{"administrator", "synthetic", "ADMIN", http.StatusNoContent},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := gin.New()
			r.Use(func(c *gin.Context) { c.Set(ContextUserID, tc.user); c.Set(ContextUserRole, tc.role) })
			r.GET("/", RequirePermission(nil, "nursing", "write"), func(c *gin.Context) { c.Status(http.StatusNoContent) })
			w := httptest.NewRecorder()
			r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
			if w.Code != tc.status {
				t.Fatalf("got %d, want %d", w.Code, tc.status)
			}
		})
	}
}

func TestPermissionGuardHonorsRoleAndUserGrants(t *testing.T) {
	db := testsupport.OpenDB(t)
	var id string
	name := testsupport.UniqueID("permission")
	if err := db.QueryRow(`INSERT INTO users (username,email,password_hash,first_name,last_name,role,department) VALUES ($1,$2,'synthetic','Synthetic','User',$1,'Test') RETURNING id`, name, name+"@example.invalid").Scan(&id); err != nil {
		t.Fatal(err)
	}
	permission := name + ":write"
	if _, err := db.Exec(`INSERT INTO permissions (id,module,action) VALUES ($1,$2,'write')`, permission, name); err != nil {
		t.Fatal(err)
	}
	request := func(want int) {
		t.Helper()
		r := gin.New()
		r.Use(func(c *gin.Context) { c.Set(ContextUserID, id); c.Set(ContextUserRole, name) })
		r.GET("/", RequirePermission(db, name, "write"), func(c *gin.Context) { c.Status(http.StatusNoContent) })
		w := httptest.NewRecorder()
		r.ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/", nil))
		if w.Code != want {
			t.Fatalf("got %d, want %d: %s", w.Code, want, w.Body)
		}
	}
	request(http.StatusForbidden)
	if _, err := db.Exec(`INSERT INTO user_permissions (user_id,permission_id,granted_by) VALUES ($1,$2,$1)`, id, permission); err != nil {
		t.Fatal(err)
	}
	request(http.StatusNoContent)
	var secondID string
	if err := db.QueryRow(`INSERT INTO users (username,email,password_hash,first_name,last_name,role,department) VALUES ($1,$2,'synthetic','Synthetic','User',$3,'Test') RETURNING id`, name+"_role", name+"_role@example.invalid", name).Scan(&secondID); err != nil {
		t.Fatal(err)
	}
	id = secondID
	request(http.StatusForbidden)
	if _, err := db.Exec(`INSERT INTO role_permissions (role,permission_id) VALUES ($1,$2)`, name, permission); err != nil {
		t.Fatal(err)
	}
	request(http.StatusNoContent)
	if _, err := db.Exec(`UPDATE users SET is_active=false WHERE id=$1`, id); err != nil {
		t.Fatal(err)
	}
	request(http.StatusUnauthorized)
}
