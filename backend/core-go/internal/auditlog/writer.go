package auditlog

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"
)

// Entry defines the payload for recording an immutable audit event
type Entry struct {
	UserID       *string                `json:"user_id,omitempty"`
	UserName     string                 `json:"user_name,omitempty"`
	UserRole     string                 `json:"user_role,omitempty"`
	Service      string                 `json:"service"` // "core-go" or "interop-py"
	Module       string                 `json:"module"`  // e.g. "medicalrecords", "laboratory", "billing"
	Action       string                 `json:"action"`  // e.g. "CREATE_PATIENT", "SUBMIT_CLAIM", "DELETE_INVOICE"
	ResourceType string                 `json:"resource_type"`
	ResourceID   string                 `json:"resource_id"`
	Details      map[string]interface{} `json:"details,omitempty"`
	IPAddress    string                 `json:"ip_address,omitempty"`
	Status       string                 `json:"status"` // "SUCCESS" or "FAILURE"
}

// Writer provides the single authoritative implementation for audit logging
type Writer struct {
	db *sql.DB
}

// NewWriter creates a new audit log writer
func NewWriter(db *sql.DB) *Writer {
	return &Writer{db: db}
}

// Record inserts an audit record into the immutable audit_logs table
func (w *Writer) Record(ctx context.Context, e Entry) error {
	return w.record(ctx, w.db, e)
}

// RecordTx writes the same mandatory audit entry inside the caller's clinical
// or financial transaction. The caller must roll back if this method fails.
// Approved 2026-10-06: preserve Record's format/defaults/error behavior while
// adding atomic mutation-and-audit support (FR-AC-05/07, FR-NS-01/04/05).
func (w *Writer) RecordTx(ctx context.Context, tx *sql.Tx, e Entry) error {
	if tx == nil {
		return fmt.Errorf("audit transaction is required")
	}
	return w.record(ctx, tx, e)
}

type executor interface {
	ExecContext(context.Context, string, ...any) (sql.Result, error)
}

func (w *Writer) record(ctx context.Context, db executor, e Entry) error {
	if e.Service == "" {
		e.Service = "core-go"
	}
	if e.Status == "" {
		e.Status = "SUCCESS"
	}

	// Normalise absent details to an empty object rather than JSON null, so the
	// column always holds an object regardless of what the caller passed.
	details := e.Details
	if details == nil {
		details = map[string]interface{}{}
	}

	detailsJSON, err := json.Marshal(details)
	if err != nil {
		// Deliberately not falling back to writing the entry with empty
		// details. An audit record that silently drops its payload still looks
		// complete to a later reader, which is worse than no record at all —
		// the caller must fix whatever could not be encoded.
		return fmt.Errorf("failed to encode audit details for %s/%s: %w", e.Module, e.Action, err)
	}

	query := `
		INSERT INTO audit_logs (
			timestamp, user_id, user_name, user_role, service, module, action,
			resource_type, resource_id, details, ip_address, status
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)`

	now := time.Now().UTC()
	_, err = db.ExecContext(ctx, query,
		now,
		e.UserID,
		e.UserName,
		e.UserRole,
		e.Service,
		e.Module,
		e.Action,
		e.ResourceType,
		e.ResourceID,
		detailsJSON,
		e.IPAddress,
		e.Status,
	)

	if err != nil {
		log.Printf("[AUDIT ERROR] Failed to write audit log: %v", err)
		return fmt.Errorf("failed to write audit log: %w", err)
	}

	return nil
}
