package modules_test

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"

	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/modules/billing"
	"hospital-hims/services/core-go/internal/modules/medicalrecords"
	"hospital-hims/services/core-go/internal/modules/nursing"
	"hospital-hims/services/core-go/internal/testsupport"
)

// Denying INSERT at PostgreSQL proves the real writer fails, without replacing
// it with a stub or changing append-only protection on the audit table.
func withoutAuditInsert(t *testing.T, admin *sql.DB) *sql.DB {
	t.Helper()
	role := testsupport.UniqueID("audit_denied")
	quoted := pgx.Identifier{role}.Sanitize()
	for _, statement := range []string{
		"CREATE ROLE " + quoted + " LOGIN PASSWORD 'synthetic-test-password'",
		"GRANT USAGE ON SCHEMA public TO " + quoted,
		"GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO " + quoted,
		"GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO " + quoted,
		"REVOKE INSERT ON audit_logs FROM " + quoted,
	} {
		if _, err := admin.Exec(statement); err != nil {
			t.Fatal(err)
		}
	}
	dsn, err := url.Parse(os.Getenv(testsupport.DatabaseURLEnv))
	if err != nil {
		t.Fatal(err)
	}
	dsn.User = url.UserPassword(role, "synthetic-test-password")
	db, err := sql.Open("pgx", dsn.String())
	if err != nil {
		t.Fatal(err)
	}
	if err := db.Ping(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if err := db.Close(); err != nil {
			t.Error(err)
		}
	})
	return db
}

func TestEveryModuleMutationRequiresPermission(t *testing.T) {
	db := testsupport.OpenDB(t)
	f := seed(t, db)
	role := testsupport.UniqueID("no_grants")
	if _, err := db.Exec(`UPDATE users SET role=$1 WHERE id=$2`, role, f.user); err != nil {
		t.Fatal(err)
	}
	tokens := auth.NewTokenService([]byte("synthetic-regression-signing-key-000000"))
	token, err := tokens.Generate(f.user, "Synthetic", role, "Test")
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	api := r.Group("/api/v1")
	writer := auditlog.NewWriter(db)
	medicalrecords.NewHandler(db, writer, tokens).RegisterRoutes(api)
	nursing.NewHandler(db, writer, tokens).RegisterRoutes(api)
	billing.NewHandler(db, writer, tokens).RegisterRoutes(api)
	for _, tc := range []struct{ method, path string }{
		{"POST", "/medical-records/patients"}, {"POST", "/medical-records/patients/" + f.patient + "/id-card"},
		{"POST", "/nursing/admissions"}, {"POST", "/nursing/vitals"}, {"POST", "/nursing/notes"}, {"POST", "/nursing/tasks"}, {"POST", "/nursing/care-plans"}, {"POST", "/nursing/shift-handovers"}, {"PUT", "/nursing/admissions/" + f.admission + "/discharge-checklist"},
		{"POST", "/billing/invoices"}, {"POST", "/billing/invoices/consolidate"}, {"POST", "/billing/payments"}, {"POST", "/billing/wallets/fund"}, {"POST", "/billing/admission-deposits"}, {"PUT", "/billing/invoices/" + f.patient + "/status"}, {"DELETE", "/billing/invoices/" + f.patient},
	} {
		req := httptest.NewRequest(tc.method, "/api/v1"+tc.path, strings.NewReader("{}"))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")
		response := httptest.NewRecorder()
		r.ServeHTTP(response, req)
		if response.Code != http.StatusForbidden {
			t.Fatalf("%s %s: got %d want denied: %s", tc.method, tc.path, response.Code, response.Body)
		}
	}
}

func TestAdmissionAndFinancialUpdatesRollbackOnAuditFailure(t *testing.T) {
	db := testsupport.OpenDB(t)
	denied := withoutAuditInsert(t, db)
	for _, available := range []bool{false, true} {
		f := seed(t, db)
		connection := denied
		if available {
			connection = db
		}
		r := router(connection, f.user, "ADMIN")
		if _, err := db.Exec(`UPDATE admissions SET status='DISCHARGED' WHERE id=$1`, f.admission); err != nil {
			t.Fatal(err)
		}
		response := send(r, "POST", "/admit", map[string]interface{}{"patient_id": f.patient, "ward_id": f.ward, "bed_id": f.bed})
		if available {
			if response.Code != 201 {
				t.Fatalf("%d %s", response.Code, response.Body)
			}
		} else if response.Code < 500 || !strings.Contains(response.Body.String(), "Audit logging unavailable") {
			t.Fatalf("%d %s", response.Code, response.Body)
		}
		var active int
		var bedStatus string
		if err := db.QueryRow(`SELECT count(*) FROM admissions WHERE patient_id=$1 AND status='ADMITTED'`, f.patient).Scan(&active); err != nil {
			t.Fatal(err)
		}
		if err := db.QueryRow(`SELECT status FROM beds WHERE id=$1`, f.bed).Scan(&bedStatus); err != nil {
			t.Fatal(err)
		}
		if available {
			if active != 1 || bedStatus != "OCCUPIED" {
				t.Fatal("admission failed to commit")
			}
		} else if active != 0 || bedStatus != "AVAILABLE" {
			t.Fatal("admission or bed survived audit rollback")
		}
		var invoice string
		if err := db.QueryRow(`INSERT INTO invoices (invoice_number,patient_id,subtotal,total_amount,balance_due,status,created_by) VALUES ($1,$2,100,100,100,'UNPAID',$3) RETURNING id`, testsupport.UniqueID("invoice"), f.patient, f.user).Scan(&invoice); err != nil {
			t.Fatal(err)
		}
		hash, err := bcrypt.GenerateFromPassword([]byte("synthetic-password"), bcrypt.MinCost)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := db.Exec(`UPDATE users SET password_hash=$1 WHERE id=$2`, string(hash), f.user); err != nil {
			t.Fatal(err)
		}
		for _, tc := range []struct {
			method, path, action string
			payload              interface{}
		}{
			{"PUT", "/status/" + invoice, "UPDATE_INVOICE_STATUS", map[string]interface{}{"status": "CANCELLED"}},
			{"DELETE", "/invoice/" + invoice, "DELETE_INVOICE", map[string]interface{}{"password": "synthetic-password", "reason": "Synthetic regression reason"}},
			{"POST", "/deposit", "RECORD_ADMISSION_DEPOSIT", map[string]interface{}{"patient_id": f.patient, "admission_id": f.admission, "amount_paid": "2", "payment_method": "CASH"}},
		} {
			response := send(r, tc.method, tc.path, tc.payload)
			if available {
				if response.Code != 200 {
					t.Fatalf("%s: %d %s", tc.action, response.Code, response.Body)
				}
			} else if response.Code < 500 || !strings.Contains(response.Body.String(), "Audit logging unavailable") {
				t.Fatalf("%s: %d %s", tc.action, response.Code, response.Body)
			}
			var count int
			if err := db.QueryRow(`SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action=$2`, f.user, tc.action).Scan(&count); err != nil {
				t.Fatal(err)
			}
			want := 0
			if available {
				want = 1
			}
			if count != want {
				t.Fatalf("%s audit count=%d want=%d", tc.action, count, want)
			}
		}
		var status, deposit string
		var deleted bool
		if err := db.QueryRow(`SELECT status,deleted_at IS NOT NULL FROM invoices WHERE id=$1`, invoice).Scan(&status, &deleted); err != nil {
			t.Fatal(err)
		}
		if err := db.QueryRow(`SELECT paid_amount FROM admission_deposits WHERE admission_id=$1`, f.admission).Scan(&deposit); err != nil {
			t.Fatal(err)
		}
		if available {
			if status != "CANCELLED" || !deleted || deposit != "3.00" {
				t.Fatal("financial updates failed to commit")
			}
		} else if status != "UNPAID" || deleted || deposit != "1.00" {
			t.Fatal("financial data survived audit rollback")
		}
	}
}

func TestConcurrentAdmissionsCannotShareABed(t *testing.T) {
	db := testsupport.OpenDB(t)
	first := seed(t, db)
	second := seed(t, db)
	if _, err := db.Exec(`UPDATE admissions SET status='DISCHARGED' WHERE id IN ($1,$2)`, first.admission, second.admission); err != nil {
		t.Fatal(err)
	}
	r := router(db, first.user, "ADMIN")
	responses := make(chan *httptest.ResponseRecorder, 2)
	for _, patient := range []string{first.patient, second.patient} {
		go func(patient string) {
			responses <- send(r, "POST", "/admit", map[string]interface{}{"patient_id": patient, "ward_id": first.ward, "bed_id": first.bed})
		}(patient)
	}
	success := 0
	for range 2 {
		response := <-responses
		if response.Code == 201 {
			success++
		} else if response.Code != 400 {
			t.Fatalf("unexpected admission response: %d %s", response.Code, response.Body)
		}
	}
	if success != 1 {
		t.Fatalf("successful admissions=%d want 1", success)
	}
	var count int
	if err := db.QueryRow(`SELECT count(*) FROM admissions WHERE bed_id=$1 AND status='ADMITTED' AND deleted_at IS NULL`, first.bed).Scan(&count); err != nil {
		t.Fatal(err)
	}
	if count != 1 {
		t.Fatalf("bed has %d active admissions", count)
	}
}

type fixture struct{ user, patient, ward, bed, admission string }

func seed(t *testing.T, db *sql.DB) fixture {
	t.Helper()
	var f fixture
	name := testsupport.UniqueID("synthetic")
	queries := []struct {
		query  string
		args   []interface{}
		target *string
	}{
		{`INSERT INTO users (username,email,password_hash,first_name,last_name,role,department) VALUES ($1,$2,'synthetic','Synthetic','User','ADMIN','Test') RETURNING id`, []interface{}{name, name + "@example.invalid"}, &f.user},
		{`INSERT INTO patients (hospital_number,first_name,last_name,date_of_birth,gender,address,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,payment_category) VALUES ('TEST-'||gen_random_uuid(),'Synthetic','Patient','2000-01-01','OTHER','Synthetic address','Synthetic Contact','0000000000','Other','CASH') RETURNING id`, nil, &f.patient},
		{`INSERT INTO wards (name,ward_type,capacity) VALUES ($1,'GENERAL',2) RETURNING id`, []interface{}{name}, &f.ward},
		{`INSERT INTO beds (ward_id,bed_number) VALUES ($1,'1') RETURNING id`, []interface{}{f.ward}, &f.bed},
		{`INSERT INTO admissions (patient_id,ward_id,bed_id,admitted_by) VALUES ($1,$2,$3,$4) RETURNING id`, []interface{}{f.patient, f.ward, f.bed, f.user}, &f.admission},
	}
	for _, q := range queries {
		if q.target == &f.bed {
			q.args = []interface{}{f.ward}
		}
		if q.target == &f.admission {
			q.args = []interface{}{f.patient, f.ward, f.bed, f.user}
		}
		if err := db.QueryRow(q.query, q.args...).Scan(q.target); err != nil {
			t.Fatal(err)
		}
	}
	if _, err := db.Exec(`INSERT INTO admission_deposits (admission_id,patient_id,paid_amount,is_cleared) VALUES ($1,$2,1,true)`, f.admission, f.patient); err != nil {
		t.Fatal(err)
	}
	return f
}

func router(db *sql.DB, user, role string) *gin.Engine {
	r := gin.New()
	r.Use(func(c *gin.Context) {
		c.Set(auth.ContextUserID, user)
		c.Set(auth.ContextUsername, "Synthetic")
		c.Set(auth.ContextUserRole, role)
	})
	w := auditlog.NewWriter(db)
	n := nursing.NewHandler(db, w, nil)
	b := billing.NewHandler(db, w, nil)
	m := medicalrecords.NewHandler(db, w, nil)
	// Direct handlers let these tests isolate atomicity from token verification.
	r.POST("/patient", m.HandleCreatePatient)
	r.POST("/vitals", n.HandleCreateVitals)
	r.POST("/notes", n.HandleCreateNursingNote)
	r.POST("/tasks", n.HandleCreateNursingTask)
	r.POST("/plans", n.HandleCreateCarePlan)
	r.POST("/handover", n.HandleCreateShiftHandover)
	r.PUT("/checklist/:id", n.HandleUpdateDischargeChecklist)
	r.POST("/admit", n.HandleCreateAdmission)
	r.POST("/invoice", b.HandleCreateInvoice)
	r.POST("/payment", b.HandleCreatePayment)
	r.POST("/fund", b.HandleFundWalletManual)
	r.POST("/deposit", b.HandleRecordAdmissionDeposit)
	r.PUT("/status/:id", b.HandleUpdateInvoiceStatus)
	r.DELETE("/invoice/:id", b.HandleDeleteInvoice)
	r.POST("/consolidate", b.HandleConsolidateCharges)
	r.GET("/patient/:id", m.HandleGetPatient)
	r.GET("/payment-status/:id", m.HandleGetPaymentStatus)
	return r
}

func TestFolderGateRequiresPositiveDepositOrExplicitEmergencyMarker(t *testing.T) {
	db := testsupport.OpenDB(t)
	f := seed(t, db)
	r := router(db, f.user, "NURSE")
	if _, err := db.Exec(`UPDATE admission_deposits SET paid_amount=0,is_cleared=false WHERE admission_id=$1`, f.admission); err != nil {
		t.Fatal(err)
	}
	for _, path := range []string{"/patient/" + f.patient, "/payment-status/" + f.patient} {
		response := send(r, "GET", path, nil)
		if strings.HasPrefix(path, "/patient/") {
			if response.Code != http.StatusPaymentRequired {
				t.Fatalf("%d: %s", response.Code, response.Body)
			}
		} else if response.Code != http.StatusOK || !strings.Contains(response.Body.String(), `"status":"BLOCKED"`) {
			t.Fatalf("%d: %s", response.Code, response.Body)
		}
	}
	if response := send(r, "POST", "/vitals", map[string]interface{}{"patient_id": f.patient, "temperature": 36.5}); response.Code != http.StatusPaymentRequired {
		t.Fatalf("vitals bypassed gate: %d %s", response.Code, response.Body)
	}
	if _, err := db.Exec(`UPDATE wards SET ward_type='A&E' WHERE id=$1`, f.ward); err != nil {
		t.Fatal(err)
	}
	if response := send(r, "GET", "/patient/"+f.patient, nil); response.Code != http.StatusPaymentRequired {
		t.Fatal("a ward type string must not grant an exemption")
	}
	if _, err := db.Exec(`UPDATE wards SET is_accident_emergency=true WHERE id=$1`, f.ward); err != nil {
		t.Fatal(err)
	}
	if response := send(r, "GET", "/patient/"+f.patient, nil); response.Code != http.StatusOK {
		t.Fatalf("explicit exemption denied: %d %s", response.Code, response.Body)
	}
	if response := send(r, "POST", "/consolidate", map[string]interface{}{"admission_id": f.admission}); response.Code != http.StatusServiceUnavailable {
		t.Fatal("unconfigured tariffs must not create an invoice")
	}
}

func TestPaymentRespectsCoverageOwnershipAndOutstandingBalance(t *testing.T) {
	db := testsupport.OpenDB(t)
	f := seed(t, db)
	other := seed(t, db)
	r := router(db, f.user, "ADMIN")
	var invoice string
	if err := db.QueryRow(`INSERT INTO invoices (invoice_number,patient_id,subtotal,total_amount,nhia_coverage,balance_due,status,created_by) VALUES ($1,$2,100,100,90,10,'UNPAID',$3) RETURNING id`, testsupport.UniqueID("invoice"), f.patient, f.user).Scan(&invoice); err != nil {
		t.Fatal(err)
	}
	for _, tc := range []struct {
		patient, amount string
		status          int
	}{{f.patient, "-1", 400}, {other.patient, "1", 400}, {f.patient, "11", 409}, {f.patient, "10", 201}, {f.patient, "1", 409}} {
		response := send(r, "POST", "/payment", map[string]interface{}{"invoice_id": invoice, "patient_id": tc.patient, "amount_paid": tc.amount, "payment_method": "CASH"})
		if response.Code != tc.status {
			t.Fatalf("amount=%s got %d want %d: %s", tc.amount, response.Code, tc.status, response.Body)
		}
	}
	var paid, balance, status string
	if err := db.QueryRow(`SELECT paid_amount,balance_due,status FROM invoices WHERE id=$1`, invoice).Scan(&paid, &balance, &status); err != nil {
		t.Fatal(err)
	}
	if paid != "10.00" || balance != "0.00" || status != "PAID" {
		t.Fatalf("coverage ignored: paid=%s balance=%s status=%s", paid, balance, status)
	}
	response := send(r, "PUT", "/status/"+invoice, map[string]interface{}{"status": "UNPAID"})
	if response.Code != http.StatusConflict {
		t.Fatalf("paid invoice could be reopened: %d %s", response.Code, response.Body)
	}
	response = send(r, "POST", "/deposit", map[string]interface{}{"patient_id": other.patient, "admission_id": f.admission, "amount_paid": "1", "payment_method": "CASH"})
	if response.Code != http.StatusBadRequest {
		t.Fatal("deposit accepted another patient's admission")
	}
}

func send(r http.Handler, method, path string, payload interface{}) *httptest.ResponseRecorder {
	data, err := json.Marshal(payload)
	if err != nil {
		panic(err)
	}
	req := httptest.NewRequest(method, path, strings.NewReader(string(data)))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	return w
}

func TestClinicalAndFinancialWritesRollbackWhenAuditFails(t *testing.T) {
	db := testsupport.OpenDB(t)
	denied := withoutAuditInsert(t, db)
	for _, auditAvailable := range []bool{false, true} {
		connection := denied
		if auditAvailable {
			connection = db
		}
		f := seed(t, db)
		r := router(connection, f.user, "ADMIN")
		patientPayload := map[string]interface{}{"first_name": testsupport.UniqueID("patient"), "last_name": "Synthetic", "date_of_birth": "2000-01-01", "gender": "OTHER", "address": "Synthetic address", "emergency_contact_name": "Synthetic Contact", "emergency_contact_phone": "0000000000", "emergency_contact_relationship": "Other", "payment_category": "CASH"}
		for _, tc := range []struct {
			name, path, method, table, where, action string
			payload                                  interface{}
		}{
			{"patient", "/patient", "POST", "patients", "first_name = '" + patientPayload["first_name"].(string) + "'", "CREATE_PATIENT", patientPayload},
			{"vitals", "/vitals", "POST", "vitals", "patient_id = '" + f.patient + "'", "CREATE_VITALS", map[string]interface{}{"patient_id": f.patient, "temperature": 36.5}},
			{"note", "/notes", "POST", "nursing_notes", "patient_id = '" + f.patient + "'", "CREATE_NURSING_NOTE", map[string]interface{}{"patient_id": f.patient, "admission_id": f.admission, "note_type": "GENERAL", "notes": "Synthetic note"}},
			{"task", "/tasks", "POST", "nursing_tasks", "patient_id = '" + f.patient + "'", "CREATE_NURSING_TASK", map[string]interface{}{"patient_id": f.patient, "admission_id": f.admission, "task_type": "ASSESSMENT", "description": "Synthetic task", "due_at": "2030-01-01T00:00:00Z"}},
			{"plan", "/plans", "POST", "care_plans", "patient_id = '" + f.patient + "'", "CREATE_CARE_PLAN", map[string]interface{}{"patient_id": f.patient, "admission_id": f.admission, "interventions": "Synthetic plan"}},
			{"handover", "/handover", "POST", "shift_handovers", "ward_id = '" + f.ward + "'", "CREATE_SHIFT_HANDOVER", map[string]interface{}{"ward_id": f.ward, "shift_date": "2026-10-06", "shift_type": "MORNING", "endorsement_notes": "Synthetic handover"}},
			{"checklist", "/checklist/" + f.admission, "PUT", "discharge_checklists", "admission_id = '" + f.admission + "'", "UPDATE_DISCHARGE_CHECKLIST", map[string]interface{}{"patient_educated": true}},
			{"invoice", "/invoice", "POST", "invoices", "patient_id = '" + f.patient + "'", "CREATE_INVOICE", map[string]interface{}{"patient_id": f.patient, "line_items": []interface{}{map[string]interface{}{"description": "Synthetic charge", "department": "TEST", "quantity": 1, "unit_price": "100.00"}}}},
			{"payment", "/payment", "POST", "payments", "patient_id = '" + f.patient + "'", "CREATE_PAYMENT", map[string]interface{}{"patient_id": f.patient, "amount_paid": "10.00", "payment_method": "CASH"}},
			{"wallet", "/fund", "POST", "wallet_transactions", "wallet_id = (SELECT id FROM wallets WHERE patient_id = '" + f.patient + "')", "FUND_WALLET_MANUAL", map[string]interface{}{"patient_id": f.patient, "amount": "20.00", "payment_method": "CASH", "reference": "Synthetic receipt"}},
		} {
			t.Run(tc.name+map[bool]string{true: "_commit", false: "_rollback"}[auditAvailable], func(t *testing.T) {
				response := send(r, tc.method, tc.path, tc.payload)
				if auditAvailable {
					if response.Code < 200 || response.Code >= 300 {
						t.Fatalf("%d: %s", response.Code, response.Body)
					}
				} else if response.Code < 500 || !strings.Contains(response.Body.String(), "Audit logging unavailable") {
					t.Fatalf("expected real audit failure, got %d: %s", response.Code, response.Body)
				}
				var count int
				if err := db.QueryRow("SELECT count(*) FROM " + tc.table + " WHERE " + tc.where).Scan(&count); err != nil {
					t.Fatal(err)
				}
				want := 0
				if auditAvailable {
					want = 1
				}
				if count != want {
					t.Fatalf("data rows=%d want %d", count, want)
				}
				if err := db.QueryRow(`SELECT count(*) FROM audit_logs WHERE user_id=$1 AND action=$2`, f.user, tc.action).Scan(&count); err != nil {
					t.Fatal(err)
				}
				if count != want {
					t.Fatalf("audit rows=%d want %d", count, want)
				}
			})
		}
		var balance string
		if err := db.QueryRow(`SELECT balance FROM wallets WHERE patient_id=$1`, f.patient).Scan(&balance); err != nil {
			t.Fatal(err)
		}
		want := "0.00"
		if auditAvailable {
			want = "20.00"
		}
		if balance != want {
			t.Fatalf("wallet balance=%s want %s", balance, want)
		}
	}
}
