package modules_test

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/modules/ae"
	"hospital-hims/services/core-go/internal/modules/maternity"
	"hospital-hims/services/core-go/internal/modules/theatre"
	"hospital-hims/services/core-go/internal/testsupport"
)

func clinicalRouter(db *sql.DB, tokens *auth.TokenService) *gin.Engine {
	r := gin.New()
	api := r.Group("/api/v1")
	writer := auditlog.NewWriter(db)
	theatre.NewHandler(db, writer, tokens).RegisterRoutes(api)
	ae.NewHandler(db, writer, tokens).RegisterRoutes(api)
	maternity.NewHandler(db, writer, tokens).RegisterRoutes(api)
	return r
}
func TestClinicalRecordsAtomicAuditAndGates(t *testing.T) {
	db := testsupport.OpenDB(t)
	f := seed(t, db)
	denied := seed(t, db)
	if _, err := db.Exec("UPDATE users SET role='SYNTHETIC_NO_GRANTS' WHERE id=$1", denied.user); err != nil {
		t.Fatal(err)
	}
	tokens := auth.NewTokenService([]byte("synthetic-clinical-record-test-key"))
	token, err := tokens.GenerateSession(f.user, "Forged name", "ADMIN", "Test", 0, testsupport.SeedMFASession(t, db, f.user))
	if err != nil {
		t.Fatal(err)
	}
	deniedToken, err := tokens.GenerateSession(denied.user, "Forged name", "ADMIN", "Test", 0, testsupport.SeedMFASession(t, db, denied.user))
	if err != nil {
		t.Fatal(err)
	}
	router := clinicalRouter(db, tokens)
	auditDenied := clinicalRouter(withoutAuditInsert(t, db), tokens)
	count := func() int {
		var n int
		if err := db.QueryRow("SELECT count(*) FROM clinical_module_records WHERE patient_id=$1", f.patient).Scan(&n); err != nil {
			t.Fatal(err)
		}
		return n
	}
	for _, spec := range []struct{ module, kind string }{{"theatre", "OPERATIVE_NOTE"}, {"emergency", "TRIAGE_NOTE"}, {"maternity", "DELIVERY_NOTE"}} {
		t.Run(spec.module, func(t *testing.T) {
			path := "/api/v1/" + spec.module + "/records"
			body := fmt.Sprintf(`{"patientId":%q,"kind":%q,"summary":"Synthetic note","notes":"Synthetic observations","occurredAt":%q}`, f.patient, spec.kind, time.Now().Add(-time.Minute).UTC().Format(time.RFC3339))
			before := count()
			for _, scenario := range []struct {
				r      *gin.Engine
				token  string
				status int
			}{{router, "", 401}, {router, deniedToken, 403}, {auditDenied, token, 503}} {
				w := operationsRequest(scenario.r, "POST", path, body, scenario.token)
				if w.Code != scenario.status {
					t.Fatalf("want %d got %d: %s", scenario.status, w.Code, w.Body)
				}
				if count() != before {
					t.Fatal("Denied or unaudited record persisted")
				}
			}
			for _, invalid := range []string{"null", "{}", `{"createdBy":"spoof"}`, strings.Replace(body, "Synthetic note", "", 1), strings.Replace(body, spec.kind, "UNKNOWN_KIND", 1)} {
				w := operationsRequest(router, "POST", path, invalid, token)
				if w.Code != 400 {
					t.Fatalf("Invalid record accepted: %d %s", w.Code, w.Body)
				}
			}
			future := fmt.Sprintf(`{"patientId":%q,"kind":%q,"summary":"Synthetic","notes":"Synthetic","occurredAt":"2099-01-01T00:00:00Z"}`, f.patient, spec.kind)
			if w := operationsRequest(router, "POST", path, future, token); w.Code != 400 {
				t.Fatal("Future observation accepted")
			}
			w := operationsRequest(router, "POST", path, body, token)
			if w.Code != 201 {
				t.Fatalf("Save: %d %s", w.Code, w.Body)
			}
			var saved map[string]interface{}
			if err := json.Unmarshal(w.Body.Bytes(), &saved); err != nil {
				t.Fatal(err)
			}
			if saved["documentationStatus"] != "RECORDED_UNVERIFIED" || saved["createdBy"] == "Forged name" {
				t.Fatal("Untrusted status/author")
			}
			if count() != before+1 {
				t.Fatal("Record not persisted")
			}
			var auditCount int
			if err := db.QueryRow("SELECT count(*) FROM audit_logs WHERE resource_id=$1 AND user_id=$2 AND action='RECORD_CLINICAL_NOTE'", saved["id"], f.user).Scan(&auditCount); err != nil || auditCount != 1 {
				t.Fatalf("Audit missing: %v", err)
			}
			for _, scenario := range []struct {
				token  string
				status int
			}{{"", 401}, {deniedToken, 403}, {token, 200}} {
				w := operationsRequest(router, "GET", path+"?patientId="+f.patient, "", scenario.token)
				if w.Code != scenario.status {
					t.Fatalf("Read: %d %s", w.Code, w.Body)
				}
				if w.Code == 200 {
					var records []map[string]interface{}
					if err := json.Unmarshal(w.Body.Bytes(), &records); err != nil {
						t.Fatal(err)
					}
					if len(records) != 1 || records[0]["id"] != saved["id"] {
						t.Fatal("Cross-module records leaked")
					}
				}
			}
			for _, query := range []struct {
				suffix string
				status int
			}{{"", 400}, {"?patientId=bad", 400}, {"?patientId=00000000-0000-0000-0000-000000000000", 404}} {
				if w := operationsRequest(router, "GET", path+query.suffix, "", token); w.Code != query.status {
					t.Fatalf("Invalid patient: %d %s", w.Code, w.Body)
				}
			}
			if _, err := db.Exec("UPDATE admission_deposits SET paid_amount=0,is_cleared=false WHERE admission_id=$1", f.admission); err != nil {
				t.Fatal(err)
			}
			for _, method := range []string{"GET", "POST"} {
				target := path
				if method == "GET" {
					target += "?patientId=" + f.patient
				}
				if w := operationsRequest(router, method, target, body, token); w.Code != 402 {
					t.Fatalf("Deposit gate: %d %s", w.Code, w.Body)
				}
			}
			if _, err := db.Exec("UPDATE wards SET is_accident_emergency=true WHERE id=$1", f.ward); err != nil {
				t.Fatal(err)
			}
			if w := operationsRequest(router, "POST", path, body, token); w.Code != 201 {
				t.Fatalf("A&E exemption: %d %s", w.Code, w.Body)
			}
			if _, err := db.Exec("UPDATE wards SET is_accident_emergency=false WHERE id=$1", f.ward); err != nil {
				t.Fatal(err)
			}
			if _, err := db.Exec("UPDATE admission_deposits SET paid_amount=0.01,is_cleared=true WHERE admission_id=$1", f.admission); err != nil {
				t.Fatal(err)
			}
			if _, err := db.Exec("UPDATE clinical_module_records SET deleted_at=NOW() WHERE id=$1", saved["id"]); err != nil {
				t.Fatal(err)
			}
			w = operationsRequest(router, "GET", path+"?patientId="+f.patient, "", token)
			if strings.Contains(w.Body.String(), saved["id"].(string)) {
				t.Fatal("Soft-deleted record exposed")
			}
		})
	}
	var status, bedStatus string
	var invoices int
	if err := db.QueryRow("SELECT status FROM admissions WHERE id=$1", f.admission).Scan(&status); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT status FROM beds WHERE id=$1", f.bed).Scan(&bedStatus); err != nil {
		t.Fatal(err)
	}
	if err := db.QueryRow("SELECT count(*) FROM invoices WHERE patient_id=$1", f.patient).Scan(&invoices); err != nil {
		t.Fatal(err)
	}
	if status != "ADMITTED" || bedStatus != "AVAILABLE" || invoices != 0 {
		t.Fatal("Recordkeeping changed care or billing state")
	}
}
