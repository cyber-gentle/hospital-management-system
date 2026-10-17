package modules_test

import (
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/modules/reporting"
	"hospital-hims/services/core-go/internal/testsupport"
	"testing"
)

func TestReportingExactTotalsAndPeriod(t *testing.T) {
	db := testsupport.OpenDB(t)
	f := seed(t, db)
	tokens := auth.NewTokenService([]byte("synthetic-reporting-test-key"))
	token, err := tokens.GenerateSession(f.user, "Synthetic", "ADMIN", "Test", 0, testsupport.SeedMFASession(t, db, f.user))
	if err != nil {
		t.Fatal(err)
	}
	r := gin.New()
	reporting.NewHandler(db, tokens).RegisterRoutes(r.Group("/api/v1"))
	path := "/api/v1/reporting/overview?startDate=1801-02-01&endDate=1801-02-28"
	read := func() map[string]interface{} {
		t.Helper()
		w := operationsRequest(r, "GET", path, "", token)
		if w.Code != 200 {
			t.Fatalf("%d %s", w.Code, w.Body)
		}
		var result map[string]interface{}
		if err := json.Unmarshal(w.Body.Bytes(), &result); err != nil {
			t.Fatal(err)
		}
		return result
	}
	// Isolate the range from earlier runs without deleting financial fixtures.
	var year int
	if err := db.QueryRow("SELECT 1800+nextval('financial_number_sequence')%7000").Scan(&year); err != nil {
		t.Fatal(err)
	}
	path = fmt.Sprintf("/api/v1/reporting/overview?startDate=%04d-02-01&endDate=%04d-02-28", year, year)
	baseline := read()
	var invoice string
	for i, spec := range []struct {
		amount, status, date string
		deleted              bool
	}{{"0.10", "PAID", "02-01", false}, {"0.20", "PARTIAL", "02-28", false}, {"9.99", "DRAFT", "02-15", false}, {"9.99", "CANCELLED", "02-15", false}, {"9.99", "PAID", "03-01", false}, {"9.99", "PAID", "02-15", true}} {
		date := fmt.Sprintf("%04d-%sT00:00:00Z", year, spec.date)
		var id string
		err := db.QueryRow(`INSERT INTO invoices(invoice_number,patient_id,total_amount,status,created_by,created_at,deleted_at) VALUES($1,$2,$3,$4,$5,$6,CASE WHEN $7 THEN NOW() ELSE NULL END) RETURNING id`, testsupport.UniqueID("report"), f.patient, spec.amount, spec.status, f.user, date, spec.deleted).Scan(&id)
		if err != nil {
			t.Fatal(err)
		}
		if i == 0 {
			invoice = id
		}
	}
	for _, spec := range []struct {
		amount, status, date string
		deleted              bool
	}{{"0.10", "COMPLETED", "02-01", false}, {"0.20", "COMPLETED", "02-28", false}, {"9.99", "PENDING", "02-15", false}, {"9.99", "REFUNDED", "02-15", false}, {"9.99", "COMPLETED", "03-01", false}, {"9.99", "COMPLETED", "02-15", true}} {
		date := fmt.Sprintf("%04d-%sT00:00:00Z", year, spec.date)
		_, err := db.Exec(`INSERT INTO payments(receipt_number,invoice_id,patient_id,amount_paid,payment_method,processed_by,status,created_at,deleted_at) VALUES($1,$2,$3,$4,'CASH',$5,$6,$7,CASE WHEN $8 THEN NOW() ELSE NULL END)`, testsupport.UniqueID("receipt"), invoice, f.patient, spec.amount, f.user, spec.status, date, spec.deleted)
		if err != nil {
			t.Fatal(err)
		}
	}
	result := read()
	if baseline["invoiceTotalsIssued"] != "0.00" || baseline["completedReceipts"] != "0.00" {
		t.Fatal("Test period collision")
	}
	if result["invoiceTotalsIssued"] != "0.30" || result["completedReceipts"] != "0.30" {
		t.Fatalf("Incorrect exact totals: %#v", result)
	}
	if result["currentAdmissions"] != baseline["currentAdmissions"] || result["timeZone"] != "UTC" {
		t.Fatal("Incorrect census/zone")
	}
	if w := operationsRequest(r, "GET", path, "", ""); w.Code != 401 {
		t.Fatal("Anonymous report access")
	}
	if _, err := db.Exec("UPDATE users SET role='SYNTHETIC_NO_GRANTS' WHERE id=$1", f.user); err != nil {
		t.Fatal(err)
	}
	if w := operationsRequest(r, "GET", path, "", token); w.Code != 403 {
		t.Fatal("Stale ADMIN token bypassed permissions")
	}
	if _, err := db.Exec("UPDATE users SET role='ADMIN' WHERE id=$1", f.user); err != nil {
		t.Fatal(err)
	}
	for _, query := range []string{"", "?startDate=bad&endDate=1801-01-01", "?startDate=1801-02-02&endDate=1801-02-01"} {
		if w := operationsRequest(r, "GET", "/api/v1/reporting/overview"+query, "", token); w.Code != 400 {
			t.Fatal("Invalid reporting range accepted")
		}
	}
}
