package auditlog

import (
	"context"
	"testing"

	"hospital-hims/services/core-go/internal/common"
	"hospital-hims/services/core-go/internal/testsupport"
)

func TestRecordTxCommitsAndRollsBackWithItsTransaction(t *testing.T) {
	db := testsupport.OpenDB(t)
	writer := NewWriter(db)
	for _, commit := range []bool{false, true} {
		ctx := context.Background()
		id := testsupport.UniqueID("atomic")
		tx, err := db.BeginTx(ctx, nil)
		if err != nil {
			t.Fatal(err)
		}
		defer common.Rollback(tx)
		if err := writer.RecordTx(ctx, tx, Entry{Module: "test", Action: "ATOMIC_TEST", ResourceType: "Synthetic", ResourceID: id}); err != nil {
			t.Fatal(err)
		}
		var count int
		if err := db.QueryRowContext(ctx, `SELECT count(*) FROM audit_logs WHERE resource_id = $1`, id).Scan(&count); err != nil {
			t.Fatal(err)
		}
		if count != 0 {
			t.Fatal("transactional audit became visible before commit")
		}
		if commit {
			if err := tx.Commit(); err != nil {
				t.Fatal(err)
			}
		} else {
			common.Rollback(tx)
		}
		if err := db.QueryRowContext(ctx, `SELECT count(*) FROM audit_logs WHERE resource_id = $1`, id).Scan(&count); err != nil {
			t.Fatal(err)
		}
		want := 0
		if commit {
			want = 1
		}
		if count != want {
			t.Fatalf("commit=%t: audit count=%d, want %d", commit, count, want)
		}
	}
}

func TestRecordTxRequiresTransaction(t *testing.T) {
	if NewWriter(nil).RecordTx(context.Background(), nil, Entry{}) == nil {
		t.Fatal("a nil transaction must never fall back to a separate audit insert")
	}
}

func TestAuditLogsRejectTruncate(t *testing.T) {
	db := testsupport.OpenDB(t)
	tx, err := db.BeginTx(context.Background(), nil)
	if err != nil {
		t.Fatal(err)
	}
	defer common.Rollback(tx)
	// Even if protection regresses, rollback preserves all existing test rows.
	if _, err := tx.Exec(`TRUNCATE audit_logs`); err == nil {
		t.Fatal("append-only audit logs accepted TRUNCATE")
	}
}
