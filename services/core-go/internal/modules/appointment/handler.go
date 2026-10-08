package appointment

import (
	"database/sql"
	"fmt"
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
	ap := router.Group("/appointments")
	ap.Use(auth.AuthRequired(h.tokens))

	// Doctor Availability
	ap.GET("/availability", auth.RequirePermission(h.db, "appointments", "read"), h.HandleGetAvailability)
	ap.POST("/availability", auth.RequirePermission(h.db, "appointments", "write"), h.HandleCreateAvailability)

	// Appointments
	ap.POST("/", auth.RequirePermission(h.db, "appointments", "write"), h.HandleBookAppointment)
	ap.GET("/", auth.RequirePermission(h.db, "appointments", "read"), h.HandleListAppointments)
	ap.PATCH("/:id", auth.RequirePermission(h.db, "appointments", "write"), h.HandleUpdateAppointment)
}

func (h *Handler) HandleGetAvailability(c *gin.Context) {
	doctorID := c.Query("doctor_id")
	query := `
		SELECT id, doctor_id, day_of_week, start_time, end_time, is_active, created_at, updated_at
		FROM doctor_availability
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	if doctorID != "" {
		query += " AND doctor_id = $1"
		args = append(args, doctorID)
	}
	query += " ORDER BY day_of_week, start_time"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch availability"})
		return
	}
	defer rows.Close()

	var avails []DoctorAvailability
	for rows.Next() {
		var a DoctorAvailability
		if err := rows.Scan(&a.ID, &a.DoctorID, &a.DayOfWeek, &a.StartTime, &a.EndTime, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading availability records"})
			return
		}
		avails = append(avails, a)
	}

	c.JSON(http.StatusOK, avails)
}

func (h *Handler) HandleCreateAvailability(c *gin.Context) {
	var req CreateAvailabilityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}
	userID := c.GetString(auth.ContextUserID)

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback()

	var availID string
	err = tx.QueryRow(`
		INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $5, $5)
		RETURNING id
	`, req.DoctorID, req.DayOfWeek, req.StartTime, req.EndTime, userID).Scan(&availID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create availability"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "CREATE_AVAILABILITY",
		Module:       "APPOINTMENTS",
		ResourceID:   availID,
		ResourceType: "DOCTOR_AVAILABILITY",
		UserID:       &userID,
		Details:      map[string]interface{}{"doctor_id": req.DoctorID, "day": req.DayOfWeek},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": availID, "message": "Availability created"})
}

func (h *Handler) HandleBookAppointment(c *gin.Context) {
	var req BookAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}
	userID := c.GetString(auth.ContextUserID)

	apptType := req.AppointmentType
	if apptType == "" {
		apptType = "SCHEDULED"
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback()

	var apptID string
	err = tx.QueryRow(`
		INSERT INTO appointments (patient_id, doctor_id, department, appointment_date, start_time, appointment_type, status, notes, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $5, $6, 'SCHEDULED', $7, $8, $8)
		RETURNING id
	`, req.PatientID, req.DoctorID, req.Department, req.AppointmentDate, req.StartTime, apptType, req.Notes, userID).Scan(&apptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to book appointment"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "BOOK_APPOINTMENT",
		Module:       "APPOINTMENTS",
		ResourceID:   apptID,
		ResourceType: "APPOINTMENT",
		UserID:       &userID,
		Details:      map[string]interface{}{"patient_id": req.PatientID, "type": apptType},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": apptID, "status": "SCHEDULED", "message": "Appointment booked"})
}

func (h *Handler) HandleListAppointments(c *gin.Context) {
	patientID := c.Query("patient_id")
	doctorID := c.Query("doctor_id")
	date := c.Query("date")

	query := `
		SELECT id, patient_id, doctor_id, department, appointment_date, start_time, end_time, status, appointment_type, notes, created_at, updated_at
		FROM appointments
		WHERE deleted_at IS NULL
	`
	args := []interface{}{}
	argCount := 1

	if patientID != "" {
		query += fmt.Sprintf(" AND patient_id = $%d", argCount)
		args = append(args, patientID)
		argCount++
	}
	if doctorID != "" {
		query += fmt.Sprintf(" AND doctor_id = $%d", argCount)
		args = append(args, doctorID)
		argCount++
	}
	if date != "" {
		query += fmt.Sprintf(" AND appointment_date = $%d", argCount)
		args = append(args, date)
		argCount++
	}
	query += " ORDER BY appointment_date, start_time"

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch appointments"})
		return
	}
	defer rows.Close()

	var appts []Appointment
	for rows.Next() {
		var a Appointment
		// Note: appointment_date might be returned as time.Time by pg driver, so we can cast it if needed,
		// but since it's DATE in PG and string in struct, we might need a time.Time scanner.
		var apptDate time.Time
		if err := rows.Scan(&a.ID, &a.PatientID, &a.DoctorID, &a.Department, &apptDate, &a.StartTime, &a.EndTime, &a.Status, &a.AppointmentType, &a.Notes, &a.CreatedAt, &a.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading appointment records"})
			return
		}
		a.AppointmentDate = apptDate.Format("2006-01-02")
		appts = append(appts, a)
	}

	c.JSON(http.StatusOK, appts)
}

func (h *Handler) HandleUpdateAppointment(c *gin.Context) {
	apptID := c.Param("id")
	var req UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}
	userID := c.GetString(auth.ContextUserID)

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback()

	// Simplistic update logic
	// In reality we'd construct a dynamic query or just update provided fields
	var currentStatus string
	err = tx.QueryRow(`SELECT status FROM appointments WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, apptID).Scan(&currentStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	if req.Status != "" {
		currentStatus = req.Status
	}

	_, err = tx.Exec(`
		UPDATE appointments
		SET status = $1, notes = COALESCE($2, notes), updated_at = CURRENT_TIMESTAMP, updated_by = $3
		WHERE id = $4
	`, currentStatus, req.Notes, userID, apptID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "UPDATE_APPOINTMENT",
		Module:       "APPOINTMENTS",
		ResourceID:   apptID,
		ResourceType: "APPOINTMENT",
		UserID:       &userID,
		Details:      map[string]interface{}{"status": currentStatus},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment updated", "status": currentStatus})
}
