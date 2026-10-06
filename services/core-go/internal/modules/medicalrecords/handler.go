package medicalrecords

import (
	"database/sql"
	"net/http"
	"strings"
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
	mr := router.Group("/medical-records")
	mr.Use(auth.AuthRequired(h.tokens)) // Ensure valid JWT

	mr.POST("/patients", auth.RequirePermission(h.db, "medicalrecords", "write"), h.HandleCreatePatient)
	mr.GET("/patients", auth.RequirePermission(h.db, "medicalrecords", "read"), h.HandleSearchPatients)
	mr.GET("/patients/:id", auth.RequirePermission(h.db, "medicalrecords", "read"), h.HandleGetPatient)
	mr.POST("/patients/:id/id-card", auth.RequirePermission(h.db, "medicalrecords", "read"), h.HandleGenerateIDCard)
	mr.GET("/patients/:id/payment-status", auth.RequirePermission(h.db, "medicalrecords", "read"), h.HandleGetPaymentStatus)
}

func (h *Handler) HandleCreatePatient(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date_of_birth format. Use YYYY-MM-DD"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer common.Rollback(tx)

	// Generate Hospital Number
	hospitalNumber, err := common.NextNumber(c.Request.Context(), tx, "HIMS")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to allocate hospital number"})
		return
	}

	query := `
		INSERT INTO patients (
			hospital_number, first_name, last_name, other_names, date_of_birth, gender,
			phone_number, email, address, blood_group, genotype, marital_status,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
			nhia_number, nhia_scheme, payment_category, registration_fee_paid, registration_fee_receipt_no,
			is_active, created_by
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, true, $21
		) RETURNING id, created_at, updated_at
	`

	var patient Patient
	patient.HospitalNumber = hospitalNumber
	patient.FirstName = req.FirstName
	patient.LastName = req.LastName
	patient.OtherNames = req.OtherNames
	patient.DateOfBirth = req.DateOfBirth
	patient.Gender = req.Gender
	patient.PhoneNumber = req.PhoneNumber
	patient.Email = req.Email
	patient.Address = req.Address
	patient.BloodGroup = req.BloodGroup
	patient.Genotype = req.Genotype
	patient.MaritalStatus = req.MaritalStatus
	patient.EmergencyContactName = req.EmergencyContactName
	patient.EmergencyContactPhone = req.EmergencyContactPhone
	patient.EmergencyContactRelationship = req.EmergencyContactRelationship
	patient.NHIANumber = req.NHIANumber
	patient.NHIAScheme = req.NHIAScheme
	patient.PaymentCategory = req.PaymentCategory
	patient.RegistrationFeePaid = req.RegistrationFeePaid
	patient.RegistrationFeeReceiptNo = req.RegistrationFeeReceiptNo
	patient.IsActive = true

	err = tx.QueryRowContext(
		c.Request.Context(), query,
		hospitalNumber, req.FirstName, req.LastName, req.OtherNames, dob, req.Gender,
		req.PhoneNumber, req.Email, req.Address, req.BloodGroup, req.Genotype, req.MaritalStatus,
		req.EmergencyContactName, req.EmergencyContactPhone, req.EmergencyContactRelationship,
		req.NHIANumber, req.NHIAScheme, req.PaymentCategory, req.RegistrationFeePaid, req.RegistrationFeeReceiptNo,
		userID,
	).Scan(&patient.ID, &patient.CreatedAt, &patient.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient: " + err.Error()})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "medical-records",
		Action:       "CREATE_PATIENT",
		ResourceType: "Patient",
		ResourceID:   patient.ID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"hospital_number": hospitalNumber,
			"first_name":      req.FirstName,
			"last_name":       req.LastName,
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

	c.JSON(http.StatusCreated, patient)
}

func (h *Handler) HandleSearchPatients(c *gin.Context) {
	searchQuery := c.Query("search")
	var rows *sql.Rows
	var err error

	baseQuery := `
		SELECT id, hospital_number, first_name, last_name, other_names, date_of_birth, gender,
			phone_number, email, address, blood_group, genotype, marital_status,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
			nhia_number, nhia_scheme, payment_category, registration_fee_paid, registration_fee_receipt_no,
			is_active, created_at, updated_at
		FROM patients
		WHERE deleted_at IS NULL
	`

	if searchQuery != "" {
		searchStr := "%" + strings.ToLower(searchQuery) + "%"
		baseQuery += ` AND (LOWER(hospital_number) LIKE $1 OR LOWER(first_name) LIKE $1 OR LOWER(last_name) LIKE $1 OR LOWER(phone_number) LIKE $1 OR LOWER(nhia_number) LIKE $1)`
		rows, err = h.db.QueryContext(c.Request.Context(), baseQuery, searchStr)
	} else {
		baseQuery += ` ORDER BY created_at DESC LIMIT 100`
		rows, err = h.db.QueryContext(c.Request.Context(), baseQuery)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search patients: " + err.Error()})
		return
	}
	defer rows.Close()

	patients := make([]Patient, 0)
	for rows.Next() {
		var p Patient
		var dob time.Time
		if err := rows.Scan(
			&p.ID, &p.HospitalNumber, &p.FirstName, &p.LastName, &p.OtherNames, &dob, &p.Gender,
			&p.PhoneNumber, &p.Email, &p.Address, &p.BloodGroup, &p.Genotype, &p.MaritalStatus,
			&p.EmergencyContactName, &p.EmergencyContactPhone, &p.EmergencyContactRelationship,
			&p.NHIANumber, &p.NHIAScheme, &p.PaymentCategory, &p.RegistrationFeePaid, &p.RegistrationFeeReceiptNo,
			&p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read patient records"})
			return
		}
		p.DateOfBirth = dob.Format("2006-01-02")
		patients = append(patients, p)
	}
	if err := rows.Err(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Unable to complete patient search"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"patients": patients,
		"total":    len(patients),
	})
}

func (h *Handler) HandleGetPatient(c *gin.Context) {
	id := c.Param("id")
	role := c.GetString(auth.ContextUserRole)
	if (role == "NURSE" || role == "DOCTOR") && !common.PatientFolderAccess(c, h.db, id) {
		return
	}

	query := `
		SELECT id, hospital_number, first_name, last_name, other_names, date_of_birth, gender,
			phone_number, email, address, blood_group, genotype, marital_status,
			emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
			nhia_number, nhia_scheme, payment_category, registration_fee_paid, registration_fee_receipt_no,
			is_active, created_at, updated_at
		FROM patients
		WHERE id = $1 AND deleted_at IS NULL
	`

	var p Patient
	var dob time.Time
	err := h.db.QueryRowContext(c.Request.Context(), query, id).Scan(
		&p.ID, &p.HospitalNumber, &p.FirstName, &p.LastName, &p.OtherNames, &dob, &p.Gender,
		&p.PhoneNumber, &p.Email, &p.Address, &p.BloodGroup, &p.Genotype, &p.MaritalStatus,
		&p.EmergencyContactName, &p.EmergencyContactPhone, &p.EmergencyContactRelationship,
		&p.NHIANumber, &p.NHIAScheme, &p.PaymentCategory, &p.RegistrationFeePaid, &p.RegistrationFeeReceiptNo,
		&p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve patient: " + err.Error()})
		}
		return
	}
	p.DateOfBirth = dob.Format("2006-01-02")
	c.JSON(http.StatusOK, p)
}

func (h *Handler) HandleGenerateIDCard(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	query := `
		SELECT hospital_number, first_name, last_name, other_names, date_of_birth, gender,
			blood_group, genotype, emergency_contact_phone
		FROM patients
		WHERE id = $1 AND deleted_at IS NULL
	`

	var hospNo, fname, lname, gender, emergPhone string
	var otherNames, bgroup, genotype *string
	var dob time.Time

	err := h.db.QueryRowContext(c.Request.Context(), query, id).Scan(
		&hospNo, &fname, &lname, &otherNames, &dob, &gender,
		&bgroup, &genotype, &emergPhone,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	fullName := fname + " " + lname
	if otherNames != nil && *otherNames != "" {
		fullName = fname + " " + *otherNames + " " + lname
	}

	cardData := PatientIDCardData{
		PatientID:      id,
		HospitalNumber: hospNo,
		FullName:       fullName,
		DateOfBirth:    dob.Format("2006-01-02"),
		Gender:         gender,
		BloodGroup:     bgroup,
		Genotype:       genotype,
		EmergencyPhone: emergPhone,
		Barcode:        hospNo,
		QRCode:         hospNo,
		IssuedAt:       time.Now().UTC().Format(time.RFC3339),
	}

	// Write mandatory audit log
	err = h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "medical-records",
		Action:       "PRINT_ID_CARD",
		ResourceType: "Patient",
		ResourceID:   id,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"hospital_number": hospNo,
			"issued_at":       cardData.IssuedAt,
		},
	})
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Audit logging unavailable"})
		return
	}

	c.JSON(http.StatusOK, cardData)
}

func (h *Handler) HandleGetPaymentStatus(c *gin.Context) {
	id := c.Param("id")

	query := `SELECT hospital_number, first_name, last_name, payment_category, nhia_number, nhia_scheme, registration_fee_paid, registration_fee_receipt_no FROM patients WHERE id = $1 AND deleted_at IS NULL`
	var hospNo, fName, lName, category string
	var nhiaNo, nhiaScheme, receiptNo *string
	var regPaid bool

	if err := h.db.QueryRowContext(c.Request.Context(), query, id).Scan(&hospNo, &fName, &lName, &category, &nhiaNo, &nhiaScheme, &regPaid, &receiptNo); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
		}
		return
	}

	var hasPendingDeposits, hasUnsettledInvoices bool
	err := h.db.QueryRowContext(c.Request.Context(), `SELECT
		EXISTS (SELECT 1 FROM admissions a JOIN wards w ON w.id=a.ward_id WHERE a.patient_id=$1 AND a.status='ADMITTED' AND a.deleted_at IS NULL AND NOT w.is_accident_emergency AND NOT EXISTS (SELECT 1 FROM admission_deposits d WHERE d.admission_id=a.id AND d.patient_id=a.patient_id AND d.paid_amount>0 AND d.deleted_at IS NULL)),
		EXISTS (SELECT 1 FROM invoices WHERE patient_id=$1 AND deleted_at IS NULL AND status NOT IN ('CANCELLED','DRAFT') AND balance_due>0)`, id).Scan(&hasPendingDeposits, &hasUnsettledInvoices)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Unable to verify payment status"})
		return
	}

	statusReason := "Cleared for service"
	eligible := true

	if hasPendingDeposits || hasUnsettledInvoices {
		eligible = false
		if hasPendingDeposits {
			statusReason = "Pending admission deposit"
		} else {
			statusReason = "Unsettled invoices"
		}
	} else if !regPaid {
		eligible = false
		statusReason = "Registration fee not paid"
	}

	c.JSON(http.StatusOK, PaymentStatusData{
		PatientID:           id,
		HospitalNumber:      hospNo,
		FullName:            fName + " " + lName,
		PaymentCategory:     category,
		NHIANumber:          nhiaNo,
		NHIAScheme:          nhiaScheme,
		RegistrationFeePaid: regPaid,
		ReceiptNo:           receiptNo,
		EligibleForService:  eligible,
		StatusReason:        statusReason,
	})
}
