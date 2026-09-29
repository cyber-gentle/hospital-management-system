package auditlog

import (
	"context"
	"database/sql"
	"encoding/json"
	"testing"
	"time"

	"hospital-hims/services/core-go/internal/testsupport"
)

// This file covers the audit writer against a real PostgreSQL instance. The
// audit trail is the one thing in this system that must never silently lose
// data, and every failure mode here is a database-level one (a bad column list,
// a missing grant, a trigger that does not fire) that a mock cannot reproduce.

func TestWriterPersistsEntry(t *testing.T) {
	db := testsupport.OpenDB(t)
	writer := NewWriter(db)
	ctx := context.Background()

	resourceID := testsupport.UniqueID("spec")

	// Bracket the write so the stored instant can be checked against real time.
	before := time.Now().UTC()

	entry := Entry{
		UserName:     "lab_tech_john",
		UserRole:     "LAB_SCIENTIST",
		Service:      "interop-py",
		Module:       "laboratory",
		Action:       "CREATE_SPECIMEN",
		ResourceType: "Specimen",
		ResourceID:   resourceID,
		Details:      map[string]interface{}{"test_type": "Full Blood Count", "priority": "routine"},
		IPAddress:    "10.0.0.5",
		Status:       "SUCCESS",
	}

	if err := writer.Record(ctx, entry); err != nil {
		t.Fatalf("failed to record audit entry: %v", err)
	}

	after := time.Now().UTC()

	var (
		gotService      string
		gotModule       string
		gotAction       string
		gotResourceType string
		gotResourceID   string
		gotUserName     string
		gotUserRole     string
		gotIP           string
		gotStatus       string
		gotDetails      []byte
		gotTimestamp    time.Time
	)

	const query = `
		SELECT service, module, action, resource_type, resource_id,
		       user_name, user_role, ip_address, status, details, timestamp
		FROM audit_logs
		WHERE resource_id = $1`

	err := db.QueryRowContext(ctx, query, resourceID).Scan(
		&gotService, &gotModule, &gotAction, &gotResourceType, &gotResourceID,
		&gotUserName, &gotUserRole, &gotIP, &gotStatus, &gotDetails, &gotTimestamp,
	)
	if err != nil {
		t.Fatalf("failed to read back the audit entry: %v", err)
	}

	checks := []struct {
		field string
		got   string
		want  string
	}{
		{"service", gotService, "interop-py"},
		{"module", gotModule, "laboratory"},
		{"action", gotAction, "CREATE_SPECIMEN"},
		{"resource_type", gotResourceType, "Specimen"},
		{"resource_id", gotResourceID, resourceID},
		{"user_name", gotUserName, "lab_tech_john"},
		{"user_role", gotUserRole, "LAB_SCIENTIST"},
		{"ip_address", gotIP, "10.0.0.5"},
		{"status", gotStatus, "SUCCESS"},
	}
	for _, check := range checks {
		if check.got != check.want {
			t.Errorf("%s: got %q, want %q", check.field, check.got, check.want)
		}
	}

	var details map[string]interface{}
	if err := json.Unmarshal(gotDetails, &details); err != nil {
		t.Fatalf("stored details are not valid JSON: %v", err)
	}
	if details["test_type"] != "Full Blood Count" {
		t.Errorf("details did not round-trip: %v", details)
	}

	// The instant the row records must be the instant it was written. Note that
	// this deliberately does not assert on timestamp.Location(): pgx returns
	// TIMESTAMPTZ tagged time.Local, and its ScanLocation option documents that
	// the location "does not change the instant in time that the timestamp
	// represents". Comparing instants is the real check; comparing location
	// labels only tests the driver's labelling.
	stored := gotTimestamp.UTC()
	if stored.Before(before) || stored.After(after) {
		t.Errorf("stored timestamp %v is outside the write window [%v, %v]", stored, before, after)
	}
}

func TestWriterDefaultsServiceAndStatus(t *testing.T) {
	db := testsupport.OpenDB(t)
	writer := NewWriter(db)
	ctx := context.Background()

	resourceID := testsupport.UniqueID("defaults")

	entry := Entry{
		Module:       "billing",
		Action:       "CREATE_INVOICE",
		ResourceType: "Invoice",
		ResourceID:   resourceID,
	}

	if err := writer.Record(ctx, entry); err != nil {
		t.Fatalf("failed to record audit entry: %v", err)
	}

	var service, status string
	err := db.QueryRowContext(ctx,
		`SELECT service, status FROM audit_logs WHERE resource_id = $1`, resourceID,
	).Scan(&service, &status)
	if err != nil {
		t.Fatalf("failed to read back the audit entry: %v", err)
	}

	if service != "core-go" {
		t.Errorf("default service: got %q, want %q", service, "core-go")
	}
	if status != "SUCCESS" {
		t.Errorf("default status: got %q, want %q", status, "SUCCESS")
	}
}

// A caller that passes no details should get an empty object, not JSON null,
// so the column is uniformly queryable.
func TestWriterStoresEmptyObjectForNilDetails(t *testing.T) {
	db := testsupport.OpenDB(t)
	writer := NewWriter(db)
	ctx := context.Background()

	resourceID := testsupport.UniqueID("nodetails")

	entry := Entry{
		Module:       "pharmacy",
		Action:       "DISPENSE",
		ResourceType: "Prescription",
		ResourceID:   resourceID,
		Details:      nil,
	}

	if err := writer.Record(ctx, entry); err != nil {
		t.Fatalf("failed to record audit entry: %v", err)
	}

	var isNull bool
	var rendered string
	err := db.QueryRowContext(ctx,
		`SELECT details IS NULL, details::text FROM audit_logs WHERE resource_id = $1`, resourceID,
	).Scan(&isNull, &rendered)
	if err != nil {
		t.Fatalf("failed to read back the audit entry: %v", err)
	}

	if isNull {
		t.Fatal("details stored as SQL NULL; want an empty JSON object")
	}
	if rendered != "{}" {
		t.Errorf("details: got %q, want %q", rendered, "{}")
	}
}

// Details that cannot be encoded must fail the write outright. Recording the
// entry with empty details would produce a record that looks complete but has
// lost its payload.
func TestWriterRejectsUnencodableDetails(t *testing.T) {
	db := testsupport.OpenDB(t)
	writer := NewWriter(db)
	ctx := context.Background()

	resourceID := testsupport.UniqueID("badjson")

	entry := Entry{
		Module:       "laboratory",
		Action:       "CREATE_SPECIMEN",
		ResourceType: "Specimen",
		ResourceID:   resourceID,
		Details:      map[string]interface{}{"unencodable": make(chan int)},
	}

	err := writer.Record(ctx, entry)
	if err == nil {
		t.Fatal("expected an error when details cannot be JSON-encoded")
	}

	var count int
	if err := db.QueryRowContext(ctx,
		`SELECT count(*) FROM audit_logs WHERE resource_id = $1`, resourceID,
	).Scan(&count); err != nil {
		t.Fatalf("failed to count rows: %v", err)
	}
	if count != 0 {
		t.Errorf("expected no audit row to be written, found %d", count)
	}
}

func TestWriterReportsFailureWhenDatabaseUnavailable(t *testing.T) {
	db := testsupport.OpenDB(t)
	writer := NewWriter(db)

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	err := writer.Record(ctx, Entry{
		Module:       "laboratory",
		Action:       "CREATE_SPECIMEN",
		ResourceType: "Specimen",
		ResourceID:   testsupport.UniqueID("canceled"),
	})
	if err == nil {
		t.Fatal("expected an error when the context is already cancelled")
	}
}

// The append-only guarantee. ARCHITECTURE.md requires that audit rows cannot be
// altered or removed; 000001_init_schema.up.sql enforces that with BEFORE
// UPDATE/DELETE triggers. These two tests are what prove the guarantee holds
// against a real database rather than only in the migration text.
func TestAuditLogsRejectUpdate(t *testing.T) {
	db := testsupport.OpenDB(t)
	ctx := context.Background()

	resourceID := testsupport.UniqueID("tamper")
	writeAuditRow(t, db, resourceID)

	_, err := db.ExecContext(ctx,
		`UPDATE audit_logs SET action = 'TAMPERED' WHERE resource_id = $1`, resourceID)
	if err == nil {
		t.Fatal("an audit row was updated; the append-only trigger did not fire")
	}

	var action string
	if err := db.QueryRowContext(ctx,
		`SELECT action FROM audit_logs WHERE resource_id = $1`, resourceID,
	).Scan(&action); err != nil {
		t.Fatalf("failed to read back the audit row: %v", err)
	}
	if action != "CREATE_SPECIMEN" {
		t.Errorf("audit row was modified: action is %q", action)
	}
}

func TestAuditLogsRejectDelete(t *testing.T) {
	db := testsupport.OpenDB(t)
	ctx := context.Background()

	resourceID := testsupport.UniqueID("tamper")
	writeAuditRow(t, db, resourceID)

	_, err := db.ExecContext(ctx,
		`DELETE FROM audit_logs WHERE resource_id = $1`, resourceID)
	if err == nil {
		t.Fatal("an audit row was deleted; the append-only trigger did not fire")
	}

	var count int
	if err := db.QueryRowContext(ctx,
		`SELECT count(*) FROM audit_logs WHERE resource_id = $1`, resourceID,
	).Scan(&count); err != nil {
		t.Fatalf("failed to count rows: %v", err)
	}
	if count != 1 {
		t.Errorf("expected the audit row to survive, found %d rows", count)
	}
}

func writeAuditRow(t *testing.T, db *sql.DB, resourceID string) {
	t.Helper()

	writer := NewWriter(db)
	err := writer.Record(context.Background(), Entry{
		Module:       "laboratory",
		Action:       "CREATE_SPECIMEN",
		ResourceType: "Specimen",
		ResourceID:   resourceID,
	})
	if err != nil {
		t.Fatalf("failed to seed an audit row: %v", err)
	}
}
