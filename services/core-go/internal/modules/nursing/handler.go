package nursing

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
)

type Handler struct {
	db          *sql.DB
	auditWriter *auditlog.Writer
	tokens      *auth.TokenService
}

func NewHandler(db *sql.DB, auditWriter *auditlog.Writer, tokens *auth.TokenService) *Handler {
	return &Handler{
		db:          db,
		auditWriter: auditWriter,
		tokens:      tokens,
	}
}

func (h *Handler) RegisterRoutes(router *gin.RouterGroup) {
	nursing := router.Group("/nursing")
	nursing.Use(auth.AuthRequired(h.tokens))

	nursing.POST("/admissions", h.HandleCreateAdmission)
}

func (h *Handler) HandleCreateAdmission(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateAdmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	// Begin a transaction because we need to update bed status as well
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// 1. Verify patient exists and is not already admitted
	var pCount int
	err = tx.QueryRowContext(c.Request.Context(), `SELECT COUNT(*) FROM patients WHERE id = $1 AND deleted_at IS NULL`, req.PatientID).Scan(&pCount)
	if err != nil || pCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient not found"})
		return
	}

	// 2. Verify bed is AVAILABLE
	var bedStatus string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT status FROM beds WHERE id = $1 AND ward_id = $2 AND deleted_at IS NULL`, req.BedID, req.WardID).Scan(&bedStatus)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Bed not found in the specified ward"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error checking bed"})
		}
		return
	}
	if bedStatus != "AVAILABLE" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bed is not available"})
		return
	}

	// 3. Mark bed as OCCUPIED
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE beds SET status = 'OCCUPIED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, req.BedID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update bed status"})
		return
	}

	// 4. Create the admission
	query := `
		INSERT INTO admissions (patient_id, ward_id, bed_id, admitted_by, reason_for_admission, status)
		VALUES ($1, $2, $3, $4, $5, 'ADMITTED')
		RETURNING id, admitted_at, created_at, updated_at
	`

	var adm Admission
	adm.PatientID = req.PatientID
	adm.WardID = req.WardID
	adm.BedID = req.BedID
	adm.AdmittedBy = userID
	adm.ReasonForAdmission = req.ReasonForAdmission
	adm.Status = "ADMITTED"

	err = tx.QueryRowContext(c.Request.Context(), query, req.PatientID, req.WardID, req.BedID, userID, req.ReasonForAdmission).
		Scan(&adm.ID, &adm.AdmittedAt, &adm.CreatedAt, &adm.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create admission record: " + err.Error()})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Audit log
	err = h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "CREATE_ADMISSION",
		ResourceType: "Admission",
		ResourceID:   adm.ID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"patient_id": req.PatientID,
			"ward_id":    req.WardID,
			"bed_id":     req.BedID,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, adm)
}
