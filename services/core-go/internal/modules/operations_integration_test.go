package modules_test

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"reflect"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	auditmodule "hospital-hims/services/core-go/internal/modules/audit"
	"hospital-hims/services/core-go/internal/modules/hr"
	"hospital-hims/services/core-go/internal/modules/inventory"
	"hospital-hims/services/core-go/internal/modules/mortuary"
	"hospital-hims/services/core-go/internal/testsupport"
)

func operationsRouter(db *sql.DB, tokens *auth.TokenService) *gin.Engine {
	gin.SetMode(gin.TestMode)
	r := gin.New()
	api := r.Group("/api/v1")
	writer := auditlog.NewWriter(db)
	hr.NewHandler(db, writer, tokens).RegisterRoutes(api)
	inventory.NewHandler(db, writer, tokens).RegisterRoutes(api)
	mortuary.NewHandler(db, writer, tokens).RegisterRoutes(api)
	auditmodule.NewHandler(db, writer, tokens).RegisterRoutes(api)
	return r
}
func operationsRequest(router *gin.Engine, method, path, body, token string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}
func operationsSnapshot(t *testing.T, db *sql.DB) []string {
	t.Helper()
	result := []string{}
	for _, table := range []string{"hr_staff", "hr_shifts", "hr_leaves", "central_inventory_items", "inventory_vendors", "inventory_purchase_orders", "inventory_goods_receipts", "inventory_issuances", "mortuary_deceased", "mortuary_chambers", "mortuary_autopsies", "mortuary_releases", "audit_exceptions"} {
		var rows string
		// Identifiers are this fixed test allowlist, never HTTP input.
		if err := db.QueryRow(`SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb)::text FROM ` + table + ` t`).Scan(&rows); err != nil {
			t.Fatal(err)
		}
		result = append(result, rows)
	}
	return result
}
func TestOperationsPersistencePermissionsAndAtomicAudit(t *testing.T) {
	db := testsupport.OpenDB(t)
	tokens := auth.NewTokenService([]byte("synthetic-operations-test-key-32-bytes"))
	unique := testsupport.UniqueID("operations")
	seedUser := func(role string) string {
		var id string
		if err := db.QueryRow(`INSERT INTO users(username,email,password_hash,first_name,last_name,role,department) VALUES($1,$2,'synthetic','Synthetic','User',$3,'Test') RETURNING id`, testsupport.UniqueID("user"), testsupport.UniqueID("email")+"@example.invalid", role).Scan(&id); err != nil {
			t.Fatal(err)
		}
		return id
	}
	admin := seedUser("ADMIN")
	reader := seedUser("SYNTHETIC_OPERATIONS_NO_GRANTS")
	token, err := tokens.Generate(admin, "Untrusted display name", "ADMIN", "Test")
	if err != nil {
		t.Fatal(err)
	}
	deniedToken, err := tokens.Generate(reader, "Synthetic", "ADMIN", "Test")
	if err != nil {
		t.Fatal(err)
	}
	router := operationsRouter(db, tokens)
	auditDenied := operationsRouter(withoutAuditInsert(t, db), tokens)
	perform := func(method, path, body, action string, status int) map[string]interface{} {
		t.Helper()
		before := operationsSnapshot(t, db)
		for _, scenario := range []struct {
			router   *gin.Engine
			token    string
			expected int
		}{{router, "", 401}, {router, deniedToken, 403}, {auditDenied, token, 503}} {
			w := operationsRequest(scenario.router, method, path, body, scenario.token)
			if w.Code != scenario.expected {
				t.Fatalf("%s %s expected %d got %d: %s", method, path, scenario.expected, w.Code, w.Body.String())
			}
			if !reflect.DeepEqual(before, operationsSnapshot(t, db)) {
				t.Fatalf("%s changed data after denial or audit failure", action)
			}
		}
		var count int
		if err := db.QueryRow(`SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action=$2`, admin, action).Scan(&count); err != nil {
			t.Fatal(err)
		}
		w := operationsRequest(router, method, path, body, token)
		if w.Code != status {
			t.Fatalf("%s %s expected %d got %d: %s", method, path, status, w.Code, w.Body.String())
		}
		var after int
		if err := db.QueryRow(`SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action=$2 AND service='core-go' AND user_name<>( 'Untrusted display name')`, admin, action).Scan(&after); err != nil {
			t.Fatal(err)
		}
		if after != count+1 {
			t.Fatalf("%s did not append its audit record", action)
		}
		result := map[string]interface{}{}
		if status != 204 {
			if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
				t.Fatal(err)
			}
		}
		return result
	}
	staffBody := fmt.Sprintf(`{"staffNumber":%q,"firstName":"Synthetic","lastName":"Staff","gender":"MALE","dateOfBirth":"1990-01-01","email":"synthetic@example.invalid","phone":"08000000000","department":"Test","cadre":"ADMINISTRATIVE","designation":"Synthetic","employmentType":"FULL_TIME","dateJoined":"2020-01-01","licenseType":"NOT_APPLICABLE","licenseStatus":"NOT_APPLICABLE","status":"ACTIVE"}`, unique)
	staff := perform("POST", "/api/v1/hr/staff", staffBody, "CREATE_STAFF", 201)
	staffID := staff["id"].(string)
	for _, invalid := range []string{`null`, `[]`, `{"unknownField":true}`, `{} {}`} {
		before := operationsSnapshot(t, db)
		response := operationsRequest(router, "PATCH", "/api/v1/hr/staff/"+staffID, invalid, token)
		if response.Code != 400 {
			t.Fatalf("Invalid object accepted: %s", response.Body.String())
		}
		if !reflect.DeepEqual(before, operationsSnapshot(t, db)) {
			t.Fatal("Invalid object changed data")
		}
	}

	perform("PATCH", "/api/v1/hr/staff/"+staffID, `{"designation":"Updated synthetic"}`, "UPDATE_STAFF", 200)
	shift := perform("POST", "/api/v1/hr/shifts", fmt.Sprintf(`{"staffId":%q,"shiftDate":"2026-10-08","shiftType":"MORNING","startTime":"08:00","endTime":"16:00","status":"SCHEDULED"}`, staffID), "CREATE_SHIFT", 201)
	shiftID := shift["id"].(string)
	perform("PATCH", "/api/v1/hr/shifts/"+shiftID, `{"notes":"Synthetic update"}`, "UPDATE_SHIFT", 200)
	perform("DELETE", "/api/v1/hr/shifts/"+shiftID, ``, "DELETE_SHIFT", 204)
	var deleted bool
	if err := db.QueryRow(`SELECT deleted_at IS NOT NULL FROM hr_shifts WHERE id=$1`, shiftID).Scan(&deleted); err != nil || !deleted {
		t.Fatalf("Shift was not soft deleted: %v", err)
	}
	leave := perform("POST", "/api/v1/hr/leaves", fmt.Sprintf(`{"staffId":%q,"leaveType":"ANNUAL","startDate":"2026-10-10","endDate":"2026-10-12","totalDays":2,"reason":"Synthetic"}`, staffID), "CREATE_LEAVE", 201)
	item := perform("POST", "/api/v1/inventory/items", fmt.Sprintf(`{"itemCode":%q,"name":"Synthetic item","category":"GENERAL_STORES","unitOfMeasure":"PIECE","currentStock":0,"minimumReorderLevel":2,"bufferStockLevel":5,"unitCostValue":0.10,"locationBin":"Synthetic"}`, unique), "CREATE_ITEM", 201)
	itemID := item["id"].(string)
	perform("PATCH", "/api/v1/inventory/items/"+itemID, `{"name":"Updated synthetic item"}`, "UPDATE_ITEM", 200)
	perform("POST", "/api/v1/inventory/items/"+itemID+"/adjust", `{"quantity":10,"reason":"Synthetic opening count"}`, "ADJUST_STOCK", 200)
	for _, body := range []string{`{"quantity":-11,"reason":"Synthetic"}`, `{"quantity":1}`, `{"quantity":1.5,"reason":"Synthetic"}`} {
		before := operationsSnapshot(t, db)
		w := operationsRequest(router, "POST", "/api/v1/inventory/items/"+itemID+"/adjust", body, token)
		if w.Code != 400 && w.Code != 409 {
			t.Fatalf("Invalid stock adjustment accepted: %s", w.Body.String())
		}
		if !reflect.DeepEqual(before, operationsSnapshot(t, db)) {
			t.Fatal("Invalid stock adjustment changed data")
		}
	}
	vendor := perform("POST", "/api/v1/inventory/vendors", `{"name":"Synthetic vendor","category":"GENERAL_STORES","email":"synthetic@example.invalid","rating":3,"status":"ACTIVE"}`, "CREATE_VENDOR", 201)
	order := perform("POST", "/api/v1/inventory/pos", fmt.Sprintf(`{"vendorId":%q,"orderDate":"2026-10-08","expectedDeliveryDate":"2026-10-10","status":"DRAFT","items":[{"itemId":%q,"quantityOrdered":3,"unitPrice":0.10,"totalPrice":999}],"totalAmountValue":999,"createdBy":"Spoofed"}`, vendor["id"], itemID), "CREATE_PURCHASE_ORDER", 201)
	if order["totalAmountValue"] != 0.30 || order["createdBy"] == "Spoofed" {
		t.Fatalf("Order trusted client totals or identity: %#v", order)
	}
	deceased := perform("POST", "/api/v1/mortuary/admit", `{"fullName":"Synthetic deceased","age":36,"gender":"OTHER","dateOfAdmission":"2026-10-07T10:00:00Z","dateOfDeath":"2026-10-07T09:00:00Z","originDepartment":"BROUGHT_IN_DEAD_BID","storageFeeDaily":12.30,"isCoronerCase":true}`, "ADMIT_DECEASED", 201)
	if deceased["financialClearancePaid"] != false || deceased["totalAccruedStorageFee"] != nil || deceased["storageBillingStatus"] != "NOT_CONFIGURED" {
		t.Fatal("Intake invented financial clearance or charges")
	}
	perform("POST", "/api/v1/mortuary/autopsies", fmt.Sprintf(`{"deceasedId":%q,"pathologistName":"Synthetic pathologist","pathologistLicense":"SYNTHETIC","autopsyDate":"2026-10-07T11:00:00Z","externalFindings":"Synthetic","internalFindings":"Synthetic","definitiveCauseOfDeath":"Synthetic"}`, deceased["id"]), "RECORD_AUTOPSY", 201)
	var logID, exceptionID string
	if err := db.QueryRow(`SELECT id FROM audit_logs WHERE user_id=$1 AND action='CREATE_STAFF' ORDER BY timestamp DESC LIMIT 1`, admin).Scan(&logID); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow(`INSERT INTO audit_exceptions(log_id,severity,category,description,detected_rule,created_by,updated_by) VALUES($1,'LOW','SYNTHETIC','Synthetic','Synthetic',$2,$2) RETURNING id`, logID, admin).Scan(&exceptionID); err != nil {
		t.Fatal(err)
	}
	perform("PATCH", "/api/v1/audit/exceptions/"+exceptionID, `{"status":"UNDER_REVIEW","notes":"Synthetic review","auditorName":"Spoofed"}`, "REVIEW_EXCEPTION", 200)
	for _, blocked := range []struct{ path, body, action string }{
		{"/api/v1/hr/leaves/" + leave["id"].(string) + "/adjudicate", `{"decision":"APPROVED"}`, "LEAVE_ADJUDICATION_BLOCKED"},
		{"/api/v1/inventory/pos/" + order["id"].(string) + "/status", `{"status":"APPROVED"}`, "PO_TRANSITION_BLOCKED"},
		{"/api/v1/inventory/grns", `{}`, "GOODS_RECEIPT_BLOCKED"},
		{"/api/v1/inventory/issuances", `{}`, "ISSUANCE_BLOCKED"},
		{"/api/v1/mortuary/releases", `{}`, "BODY_RELEASE_BLOCKED"},
		{"/api/v1/mortuary/chambers/synthetic/assign", `{}`, "CHAMBER_ASSIGNMENT_BLOCKED"},
		{"/api/v1/mortuary/chambers/synthetic/release", `{}`, "CHAMBER_RELEASE_BLOCKED"},
	} {
		method := "POST"
		if strings.Contains(blocked.path, "adjudicate") || strings.Contains(blocked.path, "/status") {
			method = "PATCH"
		}
		before := operationsSnapshot(t, db)
		for _, scenario := range []struct {
			router *gin.Engine
			token  string
			status int
		}{{router, "", 401}, {router, deniedToken, 403}, {auditDenied, token, 503}} {
			response := operationsRequest(scenario.router, method, blocked.path, blocked.body, scenario.token)
			if response.Code != scenario.status {
				t.Fatalf("Blocked route %s expected %d got %d", blocked.path, scenario.status, response.Code)
			}
			if !reflect.DeepEqual(before, operationsSnapshot(t, db)) {
				t.Fatal("Denied policy action changed data")
			}
		}
		w := operationsRequest(router, method, blocked.path, blocked.body, token)
		if w.Code != 501 {
			t.Fatalf("Unconfigured action expected 501: %s", w.Body.String())
		}
		if !reflect.DeepEqual(before, operationsSnapshot(t, db)) {
			t.Fatal("Blocked action changed operational data")
		}
		var count int
		if err := db.QueryRow(`SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action=$2 AND status='FAILURE'`, admin, blocked.action).Scan(&count); err != nil || count != 1 {
			t.Fatalf("Blocked action was not audited: %v", err)
		}
	}
	for _, path := range []string{"/api/v1/hr/staff", "/api/v1/hr/staff/" + staffID, "/api/v1/hr/shifts", "/api/v1/hr/leaves", "/api/v1/hr/metrics", "/api/v1/inventory/items", "/api/v1/inventory/vendors", "/api/v1/inventory/pos", "/api/v1/inventory/grns", "/api/v1/inventory/issuances", "/api/v1/inventory/metrics", "/api/v1/mortuary/deceased", "/api/v1/mortuary/chambers", "/api/v1/mortuary/autopsies", "/api/v1/mortuary/releases", "/api/v1/audit/logs", "/api/v1/audit/logs/" + logID, "/api/v1/audit/exceptions", "/api/v1/audit/metrics"} {
		for _, scenario := range []struct {
			token    string
			expected int
		}{{"", 401}, {deniedToken, 403}, {token, 200}} {
			w := operationsRequest(router, "GET", path, "", scenario.token)
			if w.Code != scenario.expected {
				t.Fatalf("GET %s expected %d got %d: %s", path, scenario.expected, w.Code, w.Body.String())
			}
		}
	}
	seal := operationsRequest(router, "GET", "/api/v1/audit/logs/"+logID+"/verify", "", token)
	if seal.Code != 501 || !strings.Contains(seal.Body.String(), `"valid":false`) {
		t.Fatal("Unconfigured seal was reported valid")
	}
	missing := operationsRequest(router, "GET", "/api/v1/audit/logs/00000000-0000-0000-0000-000000000000/verify", "", token)
	if missing.Code != 404 {
		t.Fatal("Nonexistent log was treated as verifiable")
	}
	badRange := operationsRequest(router, "GET", "/api/v1/audit/logs?startDate=bad", "", token)
	if badRange.Code != 400 {
		t.Fatal("Invalid audit date accepted")
	}
}
