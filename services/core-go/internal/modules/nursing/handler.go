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
	nursing.POST("/vitals", h.HandleCreateVitals)
	nursing.POST("/notes", h.HandleCreateNursingNote)
	nursing.GET("/my-patients", h.HandleGetMyPatients)
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

func (h *Handler) HandleCreateVitals(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateVitalsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	query := `
		INSERT INTO vitals (
			patient_id, admission_id, recorded_by, temperature, blood_pressure,
			pulse_rate, respiratory_rate, spO2, weight, height, notes
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
		) RETURNING id, recorded_at, created_at, updated_at
	`

	var v Vitals
	v.PatientID = req.PatientID
	v.AdmissionID = req.AdmissionID
	v.RecordedBy = userID
	v.Temperature = req.Temperature
	v.BloodPressure = req.BloodPressure
	v.PulseRate = req.PulseRate
	v.RespiratoryRate = req.RespiratoryRate
	v.SpO2 = req.SpO2
	v.Weight = req.Weight
	v.Height = req.Height
	v.Notes = req.Notes

	err := h.db.QueryRowContext(
		c.Request.Context(), query,
		req.PatientID, req.AdmissionID, userID, req.Temperature, req.BloodPressure,
		req.PulseRate, req.RespiratoryRate, req.SpO2, req.Weight, req.Height, req.Notes,
	).Scan(&v.ID, &v.RecordedAt, &v.CreatedAt, &v.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record vitals: " + err.Error()})
		return
	}

	// Audit log
	err = h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "CREATE_VITALS",
		ResourceType: "Vitals",
		ResourceID:   v.ID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"patient_id": req.PatientID,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, v)
}

func (h *Handler) HandleCreateNursingNote(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateNursingNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	query := `
		INSERT INTO nursing_notes (
			patient_id, admission_id, recorded_by, note_type, notes
		) VALUES (
			$1, $2, $3, $4, $5
		) RETURNING id, recorded_at, created_at, updated_at
	`

	var n NursingNote
	n.PatientID = req.PatientID
	n.AdmissionID = req.AdmissionID
	n.RecordedBy = userID
	n.NoteType = req.NoteType
	n.Notes = req.Notes

	err := h.db.QueryRowContext(
		c.Request.Context(), query,
		req.PatientID, req.AdmissionID, userID, req.NoteType, req.Notes,
	).Scan(&n.ID, &n.RecordedAt, &n.CreatedAt, &n.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record nursing note: " + err.Error()})
		return
	}

	// Audit log
	err = h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "CREATE_NURSING_NOTE",
		ResourceType: "NursingNote",
		ResourceID:   n.ID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"patient_id": req.PatientID,
			"note_type":  req.NoteType,
		},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log: " + err.Error()})
		return
	}

	c.JSON(http.StatusCreated, n)
}

func (h *Handler) HandleGetMyPatients(c *gin.Context) {
	// Filter by risk level if provided (e.g. ?risk=Critical)
	riskFilter := c.Query("risk")

	// Get all currently admitted patients with their ward and bed details
	query := `
		SELECT
			p.id, a.id, p.hospital_number, p.first_name, p.last_name,
			w.name, b.bed_number, a.admitted_at
		FROM admissions a
		JOIN patients p ON a.patient_id = p.id
		JOIN wards w ON a.ward_id = w.id
		JOIN beds b ON a.bed_id = b.id
		WHERE a.status = 'ADMITTED' AND a.deleted_at IS NULL
	`

	rows, err := h.db.QueryContext(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch patients: " + err.Error()})
		return
	}
	defer rows.Close()

	var patients []MyPatientResponse
	for rows.Next() {
		var mp MyPatientResponse
		if err := rows.Scan(
			&mp.PatientID, &mp.AdmissionID, &mp.HospitalNumber,
			&mp.FirstName, &mp.LastName, &mp.WardName, &mp.BedNumber, &mp.AdmittedAt,
		); err != nil {
			continue
		}

		// In a full implementation, risk level would be computed dynamically
		// from the most recent vitals (e.g. MEWS score) or a designated column.
		// For now, we stub it as "Stable".
		mp.RiskLevel = "Stable"

		if riskFilter == "" || riskFilter == mp.RiskLevel {
			patients = append(patients, mp)
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"patients": patients,
		"total":    len(patients),
	})
}
