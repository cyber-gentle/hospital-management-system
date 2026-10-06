package nursing

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/common"
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

	nursing.POST("/admissions", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateAdmission)
	nursing.POST("/vitals", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateVitals)
	nursing.POST("/notes", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateNursingNote)
	nursing.GET("/my-patients", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetMyPatients)
	nursing.POST("/tasks", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateNursingTask)
	nursing.POST("/care-plans", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateCarePlan)
	nursing.POST("/shift-handovers", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateShiftHandover)
	nursing.PUT("/admissions/:id/discharge-checklist", auth.RequirePermission(h.db, "nursing", "write"), h.HandleUpdateDischargeChecklist)
	nursing.POST("/notes/:id/sign", auth.RequirePermission(h.db, "nursing", "write"), h.HandleSignNursingNote)
	nursing.POST("/shift-handovers/:id/sign", auth.RequirePermission(h.db, "nursing", "write"), h.HandleSignShiftHandover)
	nursing.POST("/admissions/:id/discharge-checklist/complete", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCompleteDischargeChecklist)
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
	defer common.Rollback(tx)

	// 1. Verify patient exists and is not already admitted
	var patientID string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id FROM patients WHERE id = $1 AND deleted_at IS NULL AND is_active = true FOR UPDATE`, req.PatientID).Scan(&patientID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Patient not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify patient"})
		return
	}
	var admitted bool
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT EXISTS (SELECT 1 FROM admissions WHERE patient_id=$1 AND status='ADMITTED' AND deleted_at IS NULL)`, req.PatientID).Scan(&admitted); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify admission"})
		return
	}
	if admitted {
		c.JSON(http.StatusConflict, gin.H{"error": "Patient already has an active admission"})
		return
	}

	// 2. Verify bed is AVAILABLE
	var bedStatus string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT b.status FROM beds b JOIN wards w ON w.id=b.ward_id WHERE b.id = $1 AND b.ward_id = $2 AND b.deleted_at IS NULL AND b.is_active = true AND w.deleted_at IS NULL AND w.is_active = true FOR UPDATE OF b`, req.BedID, req.WardID).Scan(&bedStatus)
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

	// Audit log
	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
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

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)
	if req.AdmissionID != nil && !common.AdmissionFolderAccess(c, tx, *req.AdmissionID, req.PatientID) {
		return
	}
	if req.AdmissionID == nil && !common.PatientFolderAccess(c, tx, req.PatientID) {
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

	err = tx.QueryRowContext(
		c.Request.Context(), query,
		req.PatientID, req.AdmissionID, userID, req.Temperature, req.BloodPressure,
		req.PulseRate, req.RespiratoryRate, req.SpO2, req.Weight, req.Height, req.Notes,
	).Scan(&v.ID, &v.RecordedAt, &v.CreatedAt, &v.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record vitals: " + err.Error()})
		return
	}

	// Audit log
	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
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

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)
	if !common.AdmissionFolderAccess(c, tx, req.AdmissionID, req.PatientID) {
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

	err = tx.QueryRowContext(
		c.Request.Context(), query,
		req.PatientID, req.AdmissionID, userID, req.NoteType, req.Notes,
	).Scan(&n.ID, &n.RecordedAt, &n.CreatedAt, &n.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record nursing note: " + err.Error()})
		return
	}

	// Audit log
	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
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
			p.id, a.id, p.hospital_number, p.first_name, p.last_name, p.date_of_birth, p.gender, p.blood_group, p.payment_category, p.nhia_number,
			w.id, w.name, b.id, b.bed_number, a.admitted_at, a.status
		FROM admissions a
		JOIN patients p ON a.patient_id = p.id
		JOIN wards w ON a.ward_id = w.id
		JOIN beds b ON a.bed_id = b.id
		WHERE a.status != 'DISCHARGED' AND a.deleted_at IS NULL
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
		var fName, lName, dobStr string
		var bGroup, nhiaNo *string
		if err := rows.Scan(
			&mp.PatientID, &mp.AdmissionID, &mp.HospitalNumber,
			&fName, &lName, &dobStr, &mp.Gender, &bGroup, &mp.TariffType, &nhiaNo,
			&mp.WardID, &mp.WardName, &mp.BedID, &mp.BedNumber, &mp.AdmittedAt, &mp.Status,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read patient records"})
			return
		}

		mp.PatientName = fName + " " + lName
		if t, err := time.Parse(time.RFC3339, dobStr); err == nil {
			mp.Age = time.Now().Year() - t.Year()
		} else if t, err := time.Parse("2006-01-02T15:04:05Z", dobStr); err == nil {
			mp.Age = time.Now().Year() - t.Year()
		} else if t, err := time.Parse("2006-01-02", dobStr[:10]); err == nil {
			mp.Age = time.Now().Year() - t.Year()
		}

		if bGroup != nil {
			mp.BloodGroup = *bGroup
		}
		if nhiaNo != nil {
			mp.InsuranceNumber = *nhiaNo
		}

		mp.TriageAcuity = "stable"
		mp.DepositStatus = "paid"
		mp.Status = "admitted"

		if riskFilter == "" || riskFilter == mp.TriageAcuity {
			patients = append(patients, mp)
		}
	}

	if err := rows.Err(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Unable to complete patient query"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"patients": patients,
		"total":    len(patients),
	})
}

func (h *Handler) HandleCreateNursingTask(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateNursingTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	dueAt, err := time.Parse(time.RFC3339, req.DueAt)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid due_at format. Use RFC3339"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)
	if !common.AdmissionFolderAccess(c, tx, req.AdmissionID, req.PatientID) {
		return
	}

	query := `
		INSERT INTO nursing_tasks (patient_id, admission_id, assigned_to, task_type, description, due_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, status, created_at, updated_at
	`

	var t NursingTask
	t.PatientID = req.PatientID
	t.AdmissionID = req.AdmissionID
	t.AssignedTo = req.AssignedTo
	t.TaskType = req.TaskType
	t.Description = req.Description
	t.DueAt = dueAt

	err = tx.QueryRowContext(c.Request.Context(), query, req.PatientID, req.AdmissionID, req.AssignedTo, req.TaskType, req.Description, dueAt).
		Scan(&t.ID, &t.Status, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task: " + err.Error()})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "CREATE_NURSING_TASK",
		ResourceType: "NursingTask",
		ResourceID:   t.ID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, t)
}

func (h *Handler) HandleCreateCarePlan(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateCarePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)
	if !common.AdmissionFolderAccess(c, tx, req.AdmissionID, req.PatientID) {
		return
	}

	query := `
		INSERT INTO care_plans (patient_id, admission_id, created_by, template_name, interventions, progress_notes)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, status, created_at, updated_at
	`
	var cp CarePlan
	cp.PatientID = req.PatientID
	cp.AdmissionID = req.AdmissionID
	cp.CreatedBy = userID
	cp.TemplateName = req.TemplateName
	cp.Interventions = req.Interventions
	cp.ProgressNotes = req.ProgressNotes

	err = tx.QueryRowContext(c.Request.Context(), query, req.PatientID, req.AdmissionID, userID, req.TemplateName, req.Interventions, req.ProgressNotes).
		Scan(&cp.ID, &cp.Status, &cp.CreatedAt, &cp.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create care plan"})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "CREATE_CARE_PLAN",
		ResourceType: "CarePlan",
		ResourceID:   cp.ID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, cp)
}

func (h *Handler) HandleCreateShiftHandover(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateShiftHandoverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)

	query := `
		INSERT INTO shift_handovers (ward_id, outgoing_nurse_id, shift_date, shift_type, endorsement_notes)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, status, created_at, updated_at
	`
	var sh ShiftHandover
	sh.WardID = req.WardID
	sh.OutgoingNurseID = userID
	sh.ShiftDate = req.ShiftDate
	sh.ShiftType = req.ShiftType
	sh.EndorsementNotes = req.EndorsementNotes

	err = tx.QueryRowContext(c.Request.Context(), query, req.WardID, userID, req.ShiftDate, req.ShiftType, req.EndorsementNotes).
		Scan(&sh.ID, &sh.Status, &sh.CreatedAt, &sh.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create shift handover: " + err.Error()})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "CREATE_SHIFT_HANDOVER",
		ResourceType: "ShiftHandover",
		ResourceID:   sh.ID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, sh)
}

func (h *Handler) HandleUpdateDischargeChecklist(c *gin.Context) {
	admissionID := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req UpdateDischargeChecklistRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)
	if !common.AdmissionFolderAccess(c, tx, admissionID, "") {
		return
	}

	query := `
		INSERT INTO discharge_checklists (
			admission_id, completed_by, medications_reconciled, follow_up_scheduled, patient_educated, billing_cleared
		) VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (admission_id) DO UPDATE SET
			completed_by = $2,
			medications_reconciled = $3,
			follow_up_scheduled = $4,
			patient_educated = $5,
			billing_cleared = $6,
			updated_at = CURRENT_TIMESTAMP
		RETURNING id, status, created_at, updated_at
	`

	var dc DischargeChecklist
	dc.AdmissionID = admissionID
	dc.CompletedBy = userID
	dc.MedicationsReconciled = req.MedicationsReconciled
	dc.FollowUpScheduled = req.FollowUpScheduled
	dc.PatientEducated = req.PatientEducated
	dc.BillingCleared = req.BillingCleared

	err = tx.QueryRowContext(c.Request.Context(), query, admissionID, userID, req.MedicationsReconciled, req.FollowUpScheduled, req.PatientEducated, req.BillingCleared).
		Scan(&dc.ID, &dc.Status, &dc.CreatedAt, &dc.UpdatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update discharge checklist"})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "UPDATE_DISCHARGE_CHECKLIST",
		ResourceType: "DischargeChecklist",
		ResourceID:   dc.ID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable; the action was not completed"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, dc)
}
func (h *Handler) HandleSignNursingNote(c *gin.Context) {
	noteID := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)

	var isSigned bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT is_signed FROM nursing_notes WHERE id = $1 FOR UPDATE`, noteID).Scan(&isSigned)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nursing note not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query note"})
		return
	}

	if isSigned {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nursing note is already signed and locked"})
		return
	}

	_, err = tx.ExecContext(c.Request.Context(), `UPDATE nursing_notes SET is_signed = true, signed_at = CURRENT_TIMESTAMP, signed_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, userID, noteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign note"})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "SIGN_NURSING_NOTE",
		ResourceType: "NursingNote",
		ResourceID:   noteID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Nursing note signed successfully"})
}

func (h *Handler) HandleSignShiftHandover(c *gin.Context) {
	handoverID := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)

	var status string
	var outgoingNurseID string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT status, outgoing_nurse_id FROM shift_handovers WHERE id = $1 FOR UPDATE`, handoverID).Scan(&status, &outgoingNurseID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Shift handover not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query handover"})
		return
	}

	if status == "SIGNED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Shift handover is already signed"})
		return
	}
	if outgoingNurseID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Outgoing nurse cannot sign their own handover"})
		return
	}

	_, err = tx.ExecContext(c.Request.Context(), `UPDATE shift_handovers SET status = 'SIGNED', incoming_nurse_id = $1, signed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, userID, handoverID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sign handover"})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "SIGN_SHIFT_HANDOVER",
		ResourceType: "ShiftHandover",
		ResourceID:   handoverID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Shift handover signed successfully"})
}

func (h *Handler) HandleCompleteDischargeChecklist(c *gin.Context) {
	admissionID := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)

	if !common.AdmissionFolderAccess(c, tx, admissionID, "") {
		return
	}

	var status string
	var m1, m2, m3, m4 bool
	err = tx.QueryRowContext(c.Request.Context(), `SELECT status, medications_reconciled, follow_up_scheduled, patient_educated, billing_cleared FROM discharge_checklists WHERE admission_id = $1 FOR UPDATE`, admissionID).Scan(&status, &m1, &m2, &m3, &m4)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Discharge checklist not found"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query checklist"})
		return
	}

	if status == "COMPLETED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Discharge checklist is already completed"})
		return
	}
	if !m1 || !m2 || !m3 || !m4 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All checklist items must be true before completion"})
		return
	}

	_, err = tx.ExecContext(c.Request.Context(), `UPDATE discharge_checklists SET status = 'COMPLETED', completed_by = $1, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE admission_id = $2`, userID, admissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete checklist"})
		return
	}

	// Discharge the admission and free up the bed
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE admissions SET status = 'DISCHARGED', discharged_at = CURRENT_TIMESTAMP, discharged_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, userID, admissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update admission status"})
		return
	}

	_, err = tx.ExecContext(c.Request.Context(), `UPDATE beds SET status = 'AVAILABLE', updated_at = CURRENT_TIMESTAMP FROM admissions WHERE beds.id = admissions.bed_id AND admissions.id = $1`, admissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to free up bed"})
		return
	}

	if err := h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "nursing-services",
		Action:       "COMPLETE_DISCHARGE_CHECKLIST",
		ResourceType: "DischargeChecklist",
		ResourceID:   admissionID,
	}); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Discharge checklist completed successfully"})
}
