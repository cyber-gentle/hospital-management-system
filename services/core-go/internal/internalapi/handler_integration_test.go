package internalapi

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/testsupport"
)

// These tests cover /internal/authz/check against a real PostgreSQL. The
// permission decision is a security boundary, and the interesting failures --
// a wrong join, an unseeded table answering "allowed" -- only exist in SQL.
//
// They replace the coverage the old hard-coded fallback matrix used to have.
// That fallback was removed deliberately: it was a second implementation of the
// permission rules that could drift from role_permissions, and it answered on
// any query error. The tests below pin the two properties that matter now --
// the table is the only authority, and an unavailable authority yields no
// decision at all.

func newTestRouterWithDB(t *testing.T, db *sql.DB) *gin.Engine {
	t.Helper()

	handler := NewHandler(db, nil)
	router := gin.New()
	handler.RegisterRoutes(router, testInternalKey)
	return router
}

func checkAuthz(t *testing.T, router *gin.Engine, role, module, action string) (int, map[string]interface{}) {
	t.Helper()

	url := "/internal/authz/check?role=" + role + "&module=" + module + "&action=" + action
	req, _ := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("X-Internal-Service-Key", testInternalKey)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	var body map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	return w.Code, body
}

func TestAuthzCheckReadsThePermissionMatrix(t *testing.T) {
	db := testsupport.OpenDB(t)
	router := newTestRouterWithDB(t, db)

	// The handler derives the permission id as "<module>:<action>" (lowercased),
	// so uniqueness has to come from the module name rather than the id.
	module := testsupport.UniqueID("testmod")
	permissionID := module + ":view"
	role := testsupport.UniqueID("ROLE")

	t.Cleanup(func() {
		_, _ = db.Exec(`DELETE FROM role_permissions WHERE role = $1`, role)
		_, _ = db.Exec(`DELETE FROM permissions WHERE id = $1`, permissionID)
	})

	// Before seeding: denied. This is the case the old fallback got wrong --
	// it would have answered from its own table instead of reporting the real
	// state of role_permissions.
	status, body := checkAuthz(t, router, role, module, "view")
	if status != http.StatusOK {
		t.Fatalf("expected 200, got %d", status)
	}
	if body["allowed"] != false {
		t.Errorf("an unseeded permission must be denied; got allowed=%v", body["allowed"])
	}
	if body["source"] != "database" {
		t.Errorf("expected source=database, got %v", body["source"])
	}

	_, err := db.Exec(
		`INSERT INTO permissions (id, module, action, description) VALUES ($1, $2, $3, $4)`,
		permissionID, module, "view", "internalapi integration test fixture",
	)
	if err != nil {
		t.Fatalf("failed to seed the permission: %v", err)
	}
	_, err = db.Exec(
		`INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2)`,
		role, permissionID,
	)
	if err != nil {
		t.Fatalf("failed to grant the permission: %v", err)
	}

	// After seeding: allowed. The role is unique per run and appears in no
	// hard-coded matrix, so this answer can only have come from the table.
	status, body = checkAuthz(t, router, role, module, "view")
	if status != http.StatusOK {
		t.Fatalf("expected 200, got %d", status)
	}
	if body["allowed"] != true {
		t.Errorf("a granted permission must be allowed; got allowed=%v", body["allowed"])
	}

	// A different action on the same module is still denied -- the check is
	// per permission, not per module.
	status, body = checkAuthz(t, router, role, module, "delete")
	if status != http.StatusOK {
		t.Fatalf("expected 200, got %d", status)
	}
	if body["allowed"] != false {
		t.Errorf("an ungranted action must be denied; got allowed=%v", body["allowed"])
	}
}

// A revoked permission must take effect immediately. Nothing is cached, and
// this proves it -- a stale allow is the failure mode that matters here.
func TestAuthzCheckReflectsRevocation(t *testing.T) {
	db := testsupport.OpenDB(t)
	router := newTestRouterWithDB(t, db)

	module := testsupport.UniqueID("testmod")
	permissionID := module + ":order"
	role := testsupport.UniqueID("ROLE")

	t.Cleanup(func() {
		_, _ = db.Exec(`DELETE FROM role_permissions WHERE role = $1`, role)
		_, _ = db.Exec(`DELETE FROM permissions WHERE id = $1`, permissionID)
	})

	if _, err := db.Exec(
		`INSERT INTO permissions (id, module, action, description) VALUES ($1, $2, 'order', 'test')`,
		permissionID, module,
	); err != nil {
		t.Fatalf("failed to seed the permission: %v", err)
	}
	if _, err := db.Exec(
		`INSERT INTO role_permissions (role, permission_id) VALUES ($1, $2)`, role, permissionID,
	); err != nil {
		t.Fatalf("failed to grant the permission: %v", err)
	}

	if _, body := checkAuthz(t, router, role, module, "order"); body["allowed"] != true {
		t.Fatalf("expected the seeded grant to be allowed, got %v", body["allowed"])
	}

	if _, err := db.Exec(`DELETE FROM role_permissions WHERE role = $1`, role); err != nil {
		t.Fatalf("failed to revoke: %v", err)
	}

	if _, body := checkAuthz(t, router, role, module, "order"); body["allowed"] != false {
		t.Errorf("a revoked permission must be denied immediately, got allowed=%v", body["allowed"])
	}
}

// ADMIN is a deliberate universal-access override, not a matrix entry -- a
// fresh deployment would otherwise lock its administrators out. Pinned here so
// the intent is visible rather than implied by a branch.
func TestAuthzCheckAdminOverride(t *testing.T) {
	db := testsupport.OpenDB(t)
	router := newTestRouterWithDB(t, db)

	status, body := checkAuthz(t, router, "ADMIN", "not_a_real_module", "not_a_real_action")
	if status != http.StatusOK {
		t.Fatalf("expected 200, got %d", status)
	}
	if body["allowed"] != true {
		t.Errorf("ADMIN must keep universal access, got allowed=%v", body["allowed"])
	}
}

// The failure path that matters: the authority is configured but the query
// fails. The endpoint must return no decision rather than a guessed one.
func TestAuthzCheckFailsClosedOnQueryError(t *testing.T) {
	db := testsupport.OpenDB(t)
	router := newTestRouterWithDB(t, db)

	// A cancelled context makes the query fail without touching the database.
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	req, _ := http.NewRequestWithContext(ctx,
		http.MethodGet, "/internal/authz/check?role=DOCTOR&module=laboratory&action=order", nil)
	req.Header.Set("X-Internal-Service-Key", testInternalKey)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	if w.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503 when the permission query fails, got %d (body %s)", w.Code, w.Body.String())
	}

	var body map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &body)
	if _, answered := body["allowed"]; answered {
		t.Errorf("a failed lookup must not carry a permission decision: %s", w.Body.String())
	}
}
