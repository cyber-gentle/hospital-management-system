// Package clinicalrecords provides the approved unverified recordkeeping
// foundation shared by three Go-owned clinical modules. It never changes care,
// admission, delivery, bed, payment or sign-off state.
package clinicalrecords

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"hospital-hims/backend/core-go/internal/auditlog"
	"hospital-hims/backend/core-go/internal/auth"
	"hospital-hims/backend/core-go/internal/common"
	"hospital-hims/backend/core-go/internal/common/operations"
	"strings"
	"time"
	"unicode/utf8"
)

type Handler struct {
	db     *sql.DB
	writer *auditlog.Writer
	tokens *auth.TokenService
	module string
}

func NewHandler(db *sql.DB, writer *auditlog.Writer, tokens *auth.TokenService, module string) *Handler {
	return &Handler{db, writer, tokens, module}
}
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) {
	r := api.Group("/" + h.module)
	r.Use(auth.AuthRequired(h.tokens))
	r.GET("/records", auth.RequirePermission(h.db, h.module, "read"), h.List)
	r.POST("/records", auth.RequirePermission(h.db, h.module, "write"), h.Create)
}

type Input struct {
	PatientID  string `json:"patientId"`
	Kind       string `json:"kind"`
	Summary    string `json:"summary"`
	Notes      string `json:"notes"`
	OccurredAt string `json:"occurredAt"`
}

func (h *Handler) validKind(kind string) bool {
	allowed := map[string][]string{"theatre": {"SURGERY_BOOKING", "PRE_OP_OBSERVATION", "OPERATIVE_NOTE", "RECOVERY_NOTE"}, "emergency": {"TRIAGE_NOTE", "STABILIZATION_NOTE", "MEDICATION_RECORD"}, "maternity": {"ANTENATAL_NOTE", "DELIVERY_NOTE", "POSTNATAL_NOTE"}}
	for _, v := range allowed[h.module] {
		if kind == v {
			return true
		}
	}
	return false
}
func (h *Handler) patient(c *gin.Context, tx *sql.Tx, id string) bool {
	var found string
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT id FROM patients WHERE id=$1 AND deleted_at IS NULL FOR SHARE`, id).Scan(&found); err != nil {
		operations.OperationError(c, err)
		return false
	}
	return common.PatientFolderAccess(c, tx, id)
}
func (h *Handler) Create(c *gin.Context) {
	var input Input
	if !operations.BindOperation(c, &input) {
		return
	}
	when, err := time.Parse(time.RFC3339, input.OccurredAt)
	if err != nil || input.PatientID == "" || !h.validKind(input.Kind) || strings.TrimSpace(input.Summary) == "" || utf8.RuneCountInString(input.Summary) > 200 || strings.TrimSpace(input.Notes) == "" || utf8.RuneCountInString(input.Notes) > 20000 || (input.Kind != "SURGERY_BOOKING" && when.After(time.Now().UTC())) {
		c.JSON(400, gin.H{"error": "Valid patient, record kind, summary, notes and occurrence time are required"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	if !h.patient(c, tx, input.PatientID) {
		return
	}
	var recordID string
	var created time.Time
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO clinical_module_records(module,patient_id,kind,summary,notes,occurred_at,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$7) RETURNING id,created_at`, h.module, input.PatientID, input.Kind, strings.TrimSpace(input.Summary), input.Notes, when.UTC(), c.GetString(auth.ContextUserID)).Scan(&recordID, &created)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !operations.CommitOperation(c, tx, h.writer, h.module, "RECORD_CLINICAL_NOTE", "CLINICAL_RECORD", recordID, map[string]interface{}{"patientId": input.PatientID, "kind": input.Kind, "documentationStatus": "RECORDED_UNVERIFIED"}) {
		return
	}
	c.JSON(201, gin.H{"id": recordID, "module": h.module, "patientId": input.PatientID, "kind": input.Kind, "summary": strings.TrimSpace(input.Summary), "notes": input.Notes, "occurredAt": when.UTC(), "createdAt": created.UTC(), "createdBy": c.GetString(auth.ContextUsername), "documentationStatus": "RECORDED_UNVERIFIED"})
}
func (h *Handler) List(c *gin.Context) {
	id := c.Query("patientId")
	if id == "" {
		c.JSON(400, gin.H{"error": "Select a registered patient reference"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), &sql.TxOptions{ReadOnly: true})
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	// A read-only transaction cannot take a row lock; this statement verifies
	// the same active patient and folder gate without mutating any data.
	var found string
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT id FROM patients WHERE id=$1 AND deleted_at IS NULL`, id).Scan(&found); err != nil {
		operations.OperationError(c, err)
		return
	}
	if !common.PatientFolderAccess(c, tx, id) {
		return
	}
	rows, err := tx.QueryContext(c.Request.Context(), `SELECT r.id,r.kind,r.summary,r.notes,r.occurred_at,r.created_at,u.username,r.documentation_status FROM clinical_module_records r JOIN users u ON u.id=r.created_by WHERE r.module=$1 AND r.patient_id=$2 AND r.deleted_at IS NULL ORDER BY r.occurred_at DESC,r.id LIMIT 1000`, h.module, id)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer rows.Close()
	result := []gin.H{}
	for rows.Next() {
		var rid, kind, summary, notes, author, status string
		var occurred, created time.Time
		if err := rows.Scan(&rid, &kind, &summary, &notes, &occurred, &created, &author, &status); err != nil {
			operations.OperationError(c, err)
			return
		}
		result = append(result, gin.H{"id": rid, "module": h.module, "patientId": id, "kind": kind, "summary": summary, "notes": notes, "occurredAt": occurred.UTC(), "createdAt": created.UTC(), "createdBy": author, "documentationStatus": status})
	}
	if err := rows.Err(); err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, result)
}
