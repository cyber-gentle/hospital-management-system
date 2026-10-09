package audit

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/common"
	"hospital-hims/services/core-go/internal/common/operations"
)

type Handler struct {
	db     *sql.DB
	writer *auditlog.Writer
	tokens *auth.TokenService
}

func NewHandler(db *sql.DB, writer *auditlog.Writer, tokens *auth.TokenService) *Handler {
	return &Handler{db, writer, tokens}
}
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) {
	r := api.Group("/audit")
	r.Use(auth.AuthRequired(h.tokens))
	r.GET("/logs", auth.RequirePermission(h.db, "audit", "read"), h.Logs)
	r.GET("/logs/:id", auth.RequirePermission(h.db, "audit", "read"), h.Log)
	r.GET("/logs/:id/verify", auth.RequirePermission(h.db, "audit", "read"), h.Verify)
	r.GET("/exceptions", auth.RequirePermission(h.db, "audit", "read"), h.Exceptions)
	r.PATCH("/exceptions/:id", auth.RequirePermission(h.db, "audit", "write"), h.Review)
	r.GET("/metrics", auth.RequirePermission(h.db, "audit", "read"), h.Metrics)
}

const logDocument = `jsonb_build_object('id',l.id,'timestamp',l.timestamp,'userId',COALESCE(l.user_id::text,''),'userName',COALESCE(l.user_name,''),'userRole',COALESCE(l.user_role,''),'service',l.service,'module',l.module,'action',l.action,'resourceType',l.resource_type,'resourceId',l.resource_id,'details',l.details,'ipAddress',COALESCE(l.ip_address,''),'status',l.status,'isAnomaly',EXISTS(SELECT 1 FROM audit_exceptions e WHERE e.log_id=l.id AND e.deleted_at IS NULL AND e.status IN ('FLAGGED','UNDER_REVIEW','ESCALATED')))`

func queryValue(c *gin.Context, key string) string {
	s := c.Query(key)
	if s == "ALL" {
		return ""
	}
	return s
}
func timestamp(value string, end bool) (string, bool) {
	if value == "" {
		return "", true
	}
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed.UTC().Format(time.RFC3339Nano), true
	}
	if parsed, err := time.Parse("2006-01-02", value); err == nil {
		if end {
			parsed = parsed.Add(24*time.Hour - time.Nanosecond)
		}
		return parsed.UTC().Format(time.RFC3339Nano), true
	}
	return "", false
}
func (h *Handler) Logs(c *gin.Context) {
	limit := 200
	offset := 0
	for key, target := range map[string]*int{"limit": &limit, "offset": &offset} {
		if value := c.Query(key); value != "" {
			parsed, err := strconv.Atoi(value)
			if err != nil || parsed < 0 {
				c.JSON(400, gin.H{"error": "Invalid pagination"})
				return
			}
			*target = parsed
		}
	}
	if limit < 1 || limit > 1000 {
		c.JSON(400, gin.H{"error": "Limit must be between 1 and 1000"})
		return
	}
	start, ok := timestamp(c.Query("startDate"), false)
	if !ok {
		c.JSON(400, gin.H{"error": "Invalid start date"})
		return
	}
	end, ok := timestamp(c.Query("endDate"), true)
	if !ok {
		c.JSON(400, gin.H{"error": "Invalid end date"})
		return
	}
	if start != "" && end != "" {
		startTime, _ := time.Parse(time.RFC3339Nano, start)
		endTime, _ := time.Parse(time.RFC3339Nano, end)
		if endTime.Before(startTime) {
			c.JSON(400, gin.H{"error": "Invalid date range"})
			return
		}
	}
	category := queryValue(c, "actionCategory")
	if category != "" && category != "CLINICAL" && category != "FINANCIAL" && category != "SECURITY" && category != "OVERRIDE" {
		c.JSON(400, gin.H{"error": "Invalid action category"})
		return
	}
	operations.ListDocuments(c, h.db, `SELECT `+logDocument+` FROM audit_logs l WHERE ($1='' OR l.service=$1) AND ($2='' OR lower(l.module)=lower($2)) AND ($3='' OR l.user_role=$3) AND ($4='' OR l.status=$4) AND ($5='' OR lower(l.action||' '||COALESCE(l.user_name,'')||' '||l.resource_id) LIKE '%'||lower($5)||'%') AND ($6='' OR l.timestamp>=NULLIF($6,'')::timestamptz) AND ($7='' OR l.timestamp<=NULLIF($7,'')::timestamptz) AND (NOT $8 OR EXISTS(SELECT 1 FROM audit_exceptions e WHERE e.log_id=l.id AND e.deleted_at IS NULL)) AND ($9='' OR ($9='CLINICAL' AND lower(l.module) IN ('medicalrecords','nursing','gopd','theatre','emergency','maternity','mortuary','pharmacy','laboratory','radiology')) OR ($9='FINANCIAL' AND lower(l.module) IN ('billing','accounting','nhia','inventory')) OR ($9='SECURITY' AND (lower(l.module) IN ('admin','auth') OR l.action LIKE '%PERMISSION%' OR l.action LIKE '%ROLE%')) OR ($9='OVERRIDE' AND (l.action LIKE '%OVERRIDE%' OR l.action LIKE '%BYPASS%'))) ORDER BY l.timestamp DESC,l.id LIMIT $10 OFFSET $11`, queryValue(c, "service"), queryValue(c, "module"), queryValue(c, "userRole"), queryValue(c, "status"), c.Query("q"), start, end, c.Query("onlyAnomalies") == "true", category, limit, offset)
}
func (h *Handler) Log(c *gin.Context) {
	var record json.RawMessage
	if err := h.db.QueryRowContext(c.Request.Context(), `SELECT `+logDocument+` FROM audit_logs l WHERE l.id=$1`, c.Param("id")).Scan(&record); err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, record)
}
func (h *Handler) Verify(c *gin.Context) {
	var id string
	if err := h.db.QueryRowContext(c.Request.Context(), `SELECT id FROM audit_logs WHERE id=$1`, c.Param("id")).Scan(&id); err != nil {
		operations.OperationError(c, err)
		return
	}
	// Append-only enforcement is not a cryptographic tamper seal. No trusted
	// hash chain/key contract is configured, so never return valid=true.
	c.JSON(http.StatusNotImplemented, gin.H{"error": "Cryptographic audit verification is not configured", "code": "AUDIT_SEAL_NOT_CONFIGURED", "valid": false})
}

const exceptionDocument = `jsonb_build_object('id',e.id,'logId',e.log_id,'timestamp',e.created_at,'severity',e.severity,'category',e.category,'description',e.description,'detectedRule',e.detected_rule,'status',e.status,'assignedAuditor',COALESCE(u.username,''),'reviewNotes',COALESCE(e.review_notes,''),'reviewedAt',e.reviewed_at,'logEntry',` + logDocument + `)`

func (h *Handler) Exceptions(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT `+exceptionDocument+` FROM audit_exceptions e JOIN audit_logs l ON l.id=e.log_id LEFT JOIN users u ON u.id=e.assigned_auditor WHERE e.deleted_at IS NULL ORDER BY e.created_at DESC,e.id LIMIT 1000`)
}
func (h *Handler) Review(c *gin.Context) {
	var input struct {
		Status      string `json:"status"`
		Notes       string `json:"notes"`
		AuditorName string `json:"auditorName"`
	}
	if !operations.BindOperation(c, &input) {
		return
	}
	if input.Status != "UNDER_REVIEW" && input.Status != "CLEARED" && input.Status != "ESCALATED" {
		c.JSON(400, gin.H{"error": "Invalid review status"})
		return
	}
	if len(input.Notes) > 10000 {
		c.JSON(400, gin.H{"error": "Review notes are too long"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var id string
	err = tx.QueryRowContext(c.Request.Context(), `UPDATE audit_exceptions SET status=$2,review_notes=$3,assigned_auditor=$4,reviewed_at=CURRENT_TIMESTAMP,updated_by=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND deleted_at IS NULL RETURNING id`, c.Param("id"), input.Status, input.Notes, c.GetString(auth.ContextUserID)).Scan(&id)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	var result json.RawMessage
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT `+exceptionDocument+` FROM audit_exceptions e JOIN audit_logs l ON l.id=e.log_id LEFT JOIN users u ON u.id=e.assigned_auditor WHERE e.id=$1`, id).Scan(&result); err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "audit", "REVIEW_EXCEPTION", "AUDIT_EXCEPTION", id, map[string]interface{}{"status": input.Status, "notes": input.Notes}) {
		c.JSON(200, result)
	}
}
func (h *Handler) Metrics(c *gin.Context) {
	var total, goEvents, pythonEvents, failures, active, critical int
	err := h.db.QueryRowContext(c.Request.Context(), `SELECT count(*),count(*) FILTER(WHERE service='core-go'),count(*) FILTER(WHERE service='interop-py'),count(*) FILTER(WHERE status='FAILURE') FROM audit_logs`).Scan(&total, &goEvents, &pythonEvents, &failures)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	err = h.db.QueryRowContext(c.Request.Context(), `SELECT count(*) FILTER(WHERE status IN ('FLAGGED','UNDER_REVIEW','ESCALATED')),count(*) FILTER(WHERE severity='CRITICAL' AND status IN ('FLAGGED','UNDER_REVIEW','ESCALATED')) FROM audit_exceptions WHERE deleted_at IS NULL`).Scan(&active, &critical)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"totalEvents": total, "goServiceEvents": goEvents, "pythonServiceEvents": pythonEvents, "failuresCount": failures, "activeAnomalies": active, "criticalExceptions": critical, "integrityStatus": "UNAVAILABLE"})
}
