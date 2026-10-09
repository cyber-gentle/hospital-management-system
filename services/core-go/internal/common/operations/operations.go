package operations

import (
	"database/sql"
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgconn"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
)

// BindOperation limits record payloads before validation by the module.
func BindOperation(c *gin.Context, target interface{}) bool {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 1<<20)
	decoder := json.NewDecoder(c.Request.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(target); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return false
	}
	var extra interface{}
	if err := decoder.Decode(&extra); !errors.Is(err, io.EOF) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request must contain one JSON object"})
		return false
	}
	return true
}

// OperationError exposes conflict/validation categories without database details.
func OperationError(c *gin.Context, err error) {
	if errors.Is(err, sql.ErrNoRows) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Record not found"})
		return
	}
	var pg *pgconn.PgError
	if errors.As(err, &pg) {
		switch pg.Code {
		case "22P02", "22007", "23514", "23502":
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid record values"})
			return
		case "23505", "23503":
			c.JSON(http.StatusConflict, gin.H{"error": "Record conflict or unavailable reference"})
			return
		}
	}
	c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Database operation unavailable"})
}

// CommitOperation uses the existing writer inside the data transaction.
func CommitOperation(c *gin.Context, tx *sql.Tx, writer *auditlog.Writer, module, action, kind, id string, details map[string]interface{}) bool {
	if writer == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
		return false
	}
	userID := c.GetString(auth.ContextUserID)
	if err := writer.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID: &userID, UserName: c.GetString(auth.ContextUsername), UserRole: c.GetString(auth.ContextUserRole),
		Service: "core-go", Module: module, Action: action, ResourceType: kind, ResourceID: id,
		Details: details, IPAddress: c.ClientIP(), Status: "SUCCESS",
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable; action not saved"})
		return false
	}
	if err := tx.Commit(); err != nil {
		OperationError(c, err)
		return false
	}
	return true
}

// ListDocuments handles the standard PostgreSQL JSON row projection. Queries
// are constants supplied by module code, never constructed from HTTP input.
func ListDocuments(c *gin.Context, db *sql.DB, query string, args ...interface{}) {
	rows, err := db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		OperationError(c, err)
		return
	}
	defer rows.Close()
	result := []json.RawMessage{}
	for rows.Next() {
		var value json.RawMessage
		if err := rows.Scan(&value); err != nil {
			OperationError(c, err)
			return
		}
		result = append(result, value)
	}
	if err := rows.Err(); err != nil {
		OperationError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

// PolicyUnavailable records unsuccessful attempts without saving business data.
func PolicyUnavailable(writer *auditlog.Writer, module, action, reason string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if writer == nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
			return
		}
		userID := c.GetString(auth.ContextUserID)
		if err := writer.Record(c.Request.Context(), auditlog.Entry{
			UserID: &userID, UserName: c.GetString(auth.ContextUsername), UserRole: c.GetString(auth.ContextUserRole),
			Service: "core-go", Module: module, Action: action, ResourceType: "POLICY_GATE", ResourceID: module,
			Status: "FAILURE", IPAddress: c.ClientIP(), Details: map[string]interface{}{"reason": reason},
		}); err != nil {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
			return
		}
		c.JSON(http.StatusNotImplemented, gin.H{"error": reason, "code": "HOSPITAL_POLICY_NOT_CONFIGURED"})
	}
}
