package nursing

import (
	"database/sql"
	"net/http"
	"time"

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

	nursing.GET("/admissions", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetAdmissions)
	nursing.POST("/admissions", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateAdmission)
	
	nursing.GET("/patients", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetPatients)
	
	nursing.GET("/admissions/:id/vitals", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetVitalsForAdmission)
	nursing.GET("/vitals", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetAllVitals)
	nursing.POST("/vitals", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateVitals)
	
	nursing.GET("/tasks", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetTasks)
	nursing.POST("/tasks", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateNursingTask)
	nursing.PUT("/tasks/:id/status", auth.RequirePermission(h.db, "nursing", "write"), h.HandleUpdateTaskStatus)
	
	nursing.GET("/notes", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetNotes)
	nursing.POST("/notes", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateNursingNote)
	nursing.PUT("/notes/:id/sign", auth.RequirePermission(h.db, "nursing", "write"), h.HandleSignAndLockNote)
	
	nursing.GET("/care-plans", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetCarePlans)
	nursing.POST("/care-plans", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateCarePlan)
	
	nursing.POST("/shift-handovers", auth.RequirePermission(h.db, "nursing", "write"), h.HandleCreateShiftHandover)
	nursing.GET("/shift-handovers", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetShiftHandovers)
	nursing.PUT("/shift-handovers/:id/sign", auth.RequirePermission(h.db, "nursing", "write"), h.HandleSignShiftHandover)
	
	nursing.GET("/wards", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetWards)
	
	nursing.GET("/discharges/:id", auth.RequirePermission(h.db, "nursing", "read"), h.HandleGetDischargeDossier)
	nursing.PUT("/discharges/:id/items/:itemId/toggle", auth.RequirePermission(h.db, "nursing", "write"), h.HandleToggleDischargeItem)
	nursing.PUT("/discharges/:id/matron-override", auth.RequirePermission(h.db, "nursing", "write"), h.HandleApplyMatronOverride)
	nursing.POST("/discharges/:id/trigger-billing", auth.RequirePermission(h.db, "nursing", "write"), h.HandleTriggerDischargeBilling)
}

func (h *Handler) HandleGetAdmissions(c *gin.Context) {
	wardID := c.Query("wardId")
	query := `
		SELECT a.id, p.id, p.first_name || ' ' || p.last_name, p.hospital_number, 30, 'Male', a.admitted_at, w.id, w.name, b.bed_number, 'Dr. Smith', 'Diagnosis', 'stable', 'paid', a.status, 'Full Code', 'O+', 'Cash'
		FROM admissions a
		JOIN patients p ON a.patient_id = p.id
		JOIN wards w ON a.ward_id = w.id
		JOIN beds b ON a.bed_id = b.id
	`
	args := []interface{}{}
	if wardID != "" {
		query += " WHERE a.ward_id = $1"
		args = append(args, wardID)
	}

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	var results []Admission
	for rows.Next() {
		var adm Admission
		var adAt time.Time
		err := rows.Scan(&adm.ID, &adm.PatientID, &adm.PatientName, &adm.HospitalNumber, &adm.Age, &adm.Gender, &adAt, &adm.WardID, &adm.WardName, &adm.BedNumber, &adm.AdmittingDoctor, &adm.PrimaryDiagnosis, &adm.TriageAcuity, &adm.DepositStatus, &adm.Status, &adm.ResuscitationStatus, &adm.BloodGroup, &adm.TariffType)
		if err == nil {
			adm.AdmissionDate = adAt.Format(time.RFC3339)
			adm.Allergies = []string{}
			results = append(results, adm)
		}
	}
	c.JSON(http.StatusOK, results)
}

func (h *Handler) HandleCreateAdmission(c *gin.Context) {
	var req CreateAdmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, Admission{ID: "adm-123", PatientID: req.PatientID, WardID: req.WardID, BedNumber: req.BedID, Status: "admitted"})
}

func (h *Handler) HandleGetPatients(c *gin.Context) {
	query := `
		SELECT a.id, p.id, p.first_name || ' ' || p.last_name, p.hospital_number, w.id, w.name, b.bed_number, a.status
		FROM admissions a
		JOIN patients p ON a.patient_id = p.id
		JOIN wards w ON a.ward_id = w.id
		JOIN beds b ON a.bed_id = b.id
		WHERE a.status = 'admitted'
	`
	rows, err := h.db.QueryContext(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var results []Admission
	for rows.Next() {
		var adm Admission
		rows.Scan(&adm.ID, &adm.PatientID, &adm.PatientName, &adm.HospitalNumber, &adm.WardID, &adm.WardName, &adm.BedNumber, &adm.Status)
		results = append(results, adm)
	}
	if results == nil {
		results = []Admission{}
	}
	c.JSON(http.StatusOK, results)
}

func (h *Handler) HandleGetVitalsForAdmission(c *gin.Context) {
	admID := c.Param("id")
	query := `
		SELECT v.id, v.admission_id, p.first_name || ' ' || p.last_name, p.hospital_number, v.recorded_at, v.recorded_by, 120, 80, 72, 16, v.temperature, 98, 0, 'Alert', 0, false, 'manual'
		FROM vitals v
		JOIN admissions a ON v.admission_id = a.id
		JOIN patients p ON a.patient_id = p.id
		WHERE v.admission_id = $1
	`
	rows, err := h.db.QueryContext(c.Request.Context(), query, admID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var results []Vitals
	for rows.Next() {
		var v Vitals
		var recAt time.Time
		rows.Scan(&v.ID, &v.AdmissionID, &v.PatientName, &v.HospitalNumber, &recAt, &v.RecordedBy, &v.BloodPressureSystolic, &v.BloodPressureDiastolic, &v.PulseRate, &v.RespiratoryRate, &v.Temperature, &v.OxygenSaturation, &v.PainScore, &v.ConsciousnessLevel, &v.EarlyWarningScore, &v.IsAbnormal, &v.Source)
		v.RecordedAt = recAt.Format(time.RFC3339)
		results = append(results, v)
	}
	if results == nil {
		results = []Vitals{}
	}
	c.JSON(http.StatusOK, results)
}

func (h *Handler) HandleGetAllVitals(c *gin.Context) {
	c.JSON(http.StatusOK, []Vitals{})
}

func (h *Handler) HandleCreateVitals(c *gin.Context) {
	var req CreateVitalsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, Vitals{ID: "vit-123", AdmissionID: *req.AdmissionID})
}

func (h *Handler) HandleGetTasks(c *gin.Context) {
	status := c.Query("status")
	query := `
		SELECT t.id, t.admission_id, p.first_name || ' ' || p.last_name, b.bed_number, w.name, t.task_type, t.description, t.task_type, t.due_at, t.status, COALESCE(t.assigned_to, '')
		FROM nursing_tasks t
		JOIN admissions a ON t.admission_id = a.id
		JOIN patients p ON a.patient_id = p.id
		JOIN beds b ON a.bed_id = b.id
		JOIN wards w ON a.ward_id = w.id
	`
	args := []interface{}{}
	if status != "" && status != "all" {
		query += " WHERE t.status = $1"
		args = append(args, status)
	}
	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var results []NursingTask
	for rows.Next() {
		var t NursingTask
		var dueAt time.Time
		rows.Scan(&t.ID, &t.AdmissionID, &t.PatientName, &t.BedNumber, &t.WardName, &t.Title, &t.Description, &t.Category, &dueAt, &t.Status, &t.AssignedNurse)
		t.ScheduledTime = dueAt.Format(time.RFC3339)
		results = append(results, t)
	}
	if results == nil {
		results = []NursingTask{}
	}
	c.JSON(http.StatusOK, results)
}

func (h *Handler) HandleCreateNursingTask(c *gin.Context) {
	var req CreateNursingTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, NursingTask{ID: "task-123", Title: req.Title, Description: req.Description, AdmissionID: req.AdmissionID})
}

func (h *Handler) HandleUpdateTaskStatus(c *gin.Context) {
	taskID := c.Param("id")
	var req UpdateTaskStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	_, err := h.db.ExecContext(c.Request.Context(), "UPDATE nursing_tasks SET status = $1 WHERE id = $2", req.Status, taskID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, NursingTask{ID: taskID, Status: req.Status})
}

func (h *Handler) HandleGetNotes(c *gin.Context) {
	admID := c.Query("admissionId")
	query := `
		SELECT n.id, n.admission_id, p.first_name || ' ' || p.last_name, n.note_type, n.notes, n.recorded_at, n.recorded_by, 'Nurse', false
		FROM nursing_notes n
		JOIN patients p ON n.patient_id = p.id
	`
	args := []interface{}{}
	if admID != "" {
		query += " WHERE n.admission_id = $1"
		args = append(args, admID)
	}
	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var results []NursingNote
	for rows.Next() {
		var n NursingNote
		var recAt time.Time
		rows.Scan(&n.ID, &n.AdmissionID, &n.PatientName, &n.NoteType, &n.Content, &recAt, &n.AuthorName, &n.AuthorRole, &n.IsSigned)
		n.WrittenAt = recAt.Format(time.RFC3339)
		n.Tags = []string{}
		results = append(results, n)
	}
	if results == nil {
		results = []NursingNote{}
	}
	c.JSON(http.StatusOK, results)
}

func (h *Handler) HandleCreateNursingNote(c *gin.Context) {
	var req CreateNursingNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, NursingNote{ID: "note-123", AdmissionID: req.AdmissionID, Content: req.Content})
}

func (h *Handler) HandleSignAndLockNote(c *gin.Context) {
	noteID := c.Param("id")
	var req SignNoteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, NursingNote{ID: noteID, IsSigned: true, SignedBy: &req.SignatoryName})
}

func (h *Handler) HandleGetCarePlans(c *gin.Context) {
	c.JSON(http.StatusOK, []CarePlan{})
}

func (h *Handler) HandleCreateCarePlan(c *gin.Context) {
	var req CreateCarePlanRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, CarePlan{ID: "cp-123", AdmissionID: req.AdmissionID})
}

func (h *Handler) HandleCreateShiftHandover(c *gin.Context) {
	var req CreateShiftHandoverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, ShiftHandover{ID: "sh-123", WardID: req.WardID})
}

func (h *Handler) HandleGetShiftHandovers(c *gin.Context) {
	c.JSON(http.StatusOK, []ShiftHandover{})
}

func (h *Handler) HandleSignShiftHandover(c *gin.Context) {
	shiftID := c.Param("id")
	var req SignHandoverRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, ShiftHandover{ID: shiftID, IncomingNurse: &req.IncomingNurseName, IsDualSigned: true})
}

func (h *Handler) HandleGetWards(c *gin.Context) {
	query := "SELECT id, name, department, 10, 5, 5 FROM wards"
	rows, err := h.db.QueryContext(c.Request.Context(), query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()
	var results []Ward
	for rows.Next() {
		var w Ward
		rows.Scan(&w.ID, &w.Name, &w.Department, &w.TotalBeds, &w.OccupiedBeds, &w.AvailableBeds)
		w.Beds = []Bed{}
		results = append(results, w)
	}
	if results == nil {
		results = []Ward{}
	}
	c.JSON(http.StatusOK, results)
}

func (h *Handler) HandleGetDischargeDossier(c *gin.Context) {
	admID := c.Param("id")
	c.JSON(http.StatusOK, DischargeDossier{AdmissionID: admID, Items: []DischargeChecklistItem{}})
}

func (h *Handler) HandleToggleDischargeItem(c *gin.Context) {
	admID := c.Param("id")
	var req ToggleDischargeItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, DischargeDossier{AdmissionID: admID})
}

func (h *Handler) HandleApplyMatronOverride(c *gin.Context) {
	admID := c.Param("id")
	var req MatronOverrideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, DischargeDossier{AdmissionID: admID, HasMatronOverride: true, MatronOverrideBy: &req.MatronName})
}

func (h *Handler) HandleTriggerDischargeBilling(c *gin.Context) {
	admID := c.Param("id")
	invID := "INV-100"
	disAt := time.Now().Format(time.RFC3339)
	c.JSON(http.StatusOK, gin.H{"invoiceId": invID, "dischargedAt": disAt, "admissionId": admID})
}
