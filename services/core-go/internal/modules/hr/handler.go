package hr

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
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
	r := api.Group("/hr")
	r.Use(auth.AuthRequired(h.tokens))
	r.GET("/staff", auth.RequirePermission(h.db, "hr", "read"), h.ListStaff)
	r.GET("/staff/:id", auth.RequirePermission(h.db, "hr", "read"), h.GetStaff)
	r.POST("/staff", auth.RequirePermission(h.db, "hr", "write"), h.SaveStaff)
	r.PATCH("/staff/:id", auth.RequirePermission(h.db, "hr", "write"), h.SaveStaff)
	r.GET("/shifts", auth.RequirePermission(h.db, "hr", "read"), h.ListShifts)
	r.POST("/shifts", auth.RequirePermission(h.db, "hr", "write"), h.SaveShift)
	r.PATCH("/shifts/:id", auth.RequirePermission(h.db, "hr", "write"), h.SaveShift)
	r.DELETE("/shifts/:id", auth.RequirePermission(h.db, "hr", "write"), h.DeleteShift)
	r.GET("/leaves", auth.RequirePermission(h.db, "hr", "read"), h.ListLeaves)
	r.POST("/leaves", auth.RequirePermission(h.db, "hr", "write"), h.CreateLeave)
	r.PATCH("/leaves/:id/adjudicate", auth.RequirePermission(h.db, "hr", "approve"), operations.PolicyUnavailable(h.writer, "hr", "LEAVE_ADJUDICATION_BLOCKED", "Leave approval rules are not configured; no leave decision was saved"))
	r.GET("/metrics", auth.RequirePermission(h.db, "hr", "read"), h.Metrics)
}

type BankDetails struct {
	BankName      string `json:"bankName"`
	AccountNumber string `json:"accountNumber"`
}
type Staff struct {
	ID                string       `json:"id"`
	StaffNumber       string       `json:"staffNumber"`
	FirstName         string       `json:"firstName"`
	LastName          string       `json:"lastName"`
	OtherNames        string       `json:"otherNames,omitempty"`
	Gender            string       `json:"gender"`
	DateOfBirth       string       `json:"dateOfBirth"`
	Email             string       `json:"email"`
	Phone             string       `json:"phone"`
	Department        string       `json:"department"`
	Cadre             string       `json:"cadre"`
	Designation       string       `json:"designation"`
	EmploymentType    string       `json:"employmentType"`
	DateJoined        string       `json:"dateJoined"`
	LicenseType       string       `json:"licenseType"`
	LicenseNumber     string       `json:"licenseNumber,omitempty"`
	LicenseExpiryDate string       `json:"licenseExpiryDate,omitempty"`
	LicenseStatus     string       `json:"licenseStatus"`
	Status            string       `json:"status"`
	BankDetails       *BankDetails `json:"bankDetails,omitempty"`
}

func oneOf(value string, options ...string) bool {
	for _, option := range options {
		if value == option {
			return true
		}
	}
	return false
}
func date(value string) bool { _, err := time.Parse("2006-01-02", value); return err == nil }
func (s Staff) valid() bool {
	return strings.TrimSpace(s.StaffNumber) != "" && len(s.StaffNumber) <= 100 && strings.TrimSpace(s.FirstName) != "" && strings.TrimSpace(s.LastName) != "" && strings.TrimSpace(s.Department) != "" && strings.TrimSpace(s.Designation) != "" && strings.Contains(s.Email, "@") && date(s.DateOfBirth) && date(s.DateJoined) && (s.LicenseExpiryDate == "" || date(s.LicenseExpiryDate)) &&
		oneOf(s.Gender, "MALE", "FEMALE") && oneOf(s.Cadre, "MEDICAL", "NURSING", "PHARMACY", "LABORATORY", "ADMINISTRATIVE", "ALLIED_HEALTH") && oneOf(s.EmploymentType, "FULL_TIME", "PART_TIME", "CONTRACT", "LOCUM", "INTERN") && oneOf(s.Status, "ACTIVE", "ON_LEAVE", "SUSPENDED", "RESIGNED", "RETIRED") && oneOf(s.LicenseType, "MDCN", "NMCN", "PCN", "MLSCN", "RRBN", "NOT_APPLICABLE") && oneOf(s.LicenseStatus, "ACTIVE", "EXPIRING_SOON", "EXPIRED", "NOT_APPLICABLE")
}
func (h *Handler) ListStaff(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT profile || jsonb_build_object('id',id) FROM hr_staff WHERE deleted_at IS NULL AND ($1='' OR profile->>'department'=$1) AND ($2='' OR profile->>'cadre'=$2) AND ($3='' OR profile->>'status'=$3) AND ($4='' OR lower((profile->>'firstName')||' '||(profile->>'lastName')||' '||staff_number) LIKE '%'||lower($4)||'%') ORDER BY staff_number LIMIT 1000`, filter(c, "department"), filter(c, "cadre"), filter(c, "status"), c.Query("search"))
}
func filter(c *gin.Context, key string) string {
	value := c.Query(key)
	if value == "ALL" {
		return ""
	}
	return value
}
func (h *Handler) GetStaff(c *gin.Context) {
	var record json.RawMessage
	if err := h.db.QueryRowContext(c.Request.Context(), `SELECT profile || jsonb_build_object('id',id) FROM hr_staff WHERE id=$1 AND deleted_at IS NULL`, c.Param("id")).Scan(&record); err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, record)
}
func (h *Handler) SaveStaff(c *gin.Context) {
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var record Staff
	id := c.Param("id")
	action := "CREATE_STAFF"
	status := 201
	if id != "" {
		var raw []byte
		if err := tx.QueryRowContext(c.Request.Context(), `SELECT profile FROM hr_staff WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, id).Scan(&raw); err != nil {
			operations.OperationError(c, err)
			return
		}
		if err := json.Unmarshal(raw, &record); err != nil {
			operations.OperationError(c, err)
			return
		}
		action = "UPDATE_STAFF"
		status = 200
	}
	if !operations.BindOperation(c, &record) {
		return
	}
	if !record.valid() || (record.ID != "" && record.ID != id) {
		c.JSON(400, gin.H{"error": "Invalid staff profile"})
		return
	}
	record.ID = ""
	raw, err := json.Marshal(record)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	user := c.GetString(auth.ContextUserID)
	if id == "" {
		err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO hr_staff(staff_number,profile,created_by,updated_by) VALUES($1,$2,$3,$3) RETURNING id`, record.StaffNumber, raw, user).Scan(&id)
	} else {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE hr_staff SET staff_number=$2,profile=$3,updated_by=$4,updated_at=CURRENT_TIMESTAMP WHERE id=$1`, id, record.StaffNumber, raw, user)
	}
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !operations.CommitOperation(c, tx, h.writer, "hr", action, "STAFF", id, map[string]interface{}{"staffNumber": record.StaffNumber}) {
		return
	}
	record.ID = id
	c.JSON(status, record)
}

type Shift struct {
	ID         string `json:"id"`
	Department string `json:"department"`
	WardOrUnit string `json:"wardOrUnit,omitempty"`
	StaffID    string `json:"staffId"`
	StaffName  string `json:"staffName"`
	StaffRole  string `json:"staffRole"`
	ShiftDate  string `json:"shiftDate"`
	ShiftType  string `json:"shiftType"`
	StartTime  string `json:"startTime"`
	EndTime    string `json:"endTime"`
	Status     string `json:"status"`
	Notes      string `json:"notes,omitempty"`
}

func (s Shift) valid() bool {
	_, startErr := time.Parse("15:04", s.StartTime)
	_, endErr := time.Parse("15:04", s.EndTime)
	return s.StaffID != "" && date(s.ShiftDate) && startErr == nil && endErr == nil && s.StartTime != s.EndTime && oneOf(s.ShiftType, "MORNING", "AFTERNOON", "NIGHT", "CALL_DUTY", "OFF_DUTY") && oneOf(s.Status, "SCHEDULED", "COMPLETED", "SWAPPED", "ABSENT")
}
func (h *Handler) ListShifts(c *gin.Context) {
	for _, key := range []string{"startDate", "endDate"} {
		if c.Query(key) != "" && !date(c.Query(key)) {
			c.JSON(400, gin.H{"error": "Invalid date filter"})
			return
		}
	}
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM hr_shifts WHERE deleted_at IS NULL AND ($1='' OR details->>'department'=$1) AND ($2='' OR shift_date>=NULLIF($2,'')::date) AND ($3='' OR shift_date<=NULLIF($3,'')::date) ORDER BY shift_date,id LIMIT 1000`, filter(c, "department"), c.Query("startDate"), c.Query("endDate"))
}
func (h *Handler) SaveShift(c *gin.Context) {
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var record Shift
	id := c.Param("id")
	action := "CREATE_SHIFT"
	status := 201
	if id != "" {
		var raw []byte
		if err := tx.QueryRowContext(c.Request.Context(), `SELECT details FROM hr_shifts WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, id).Scan(&raw); err != nil {
			operations.OperationError(c, err)
			return
		}
		if err := json.Unmarshal(raw, &record); err != nil {
			operations.OperationError(c, err)
			return
		}
		action = "UPDATE_SHIFT"
		status = 200
	}
	if !operations.BindOperation(c, &record) {
		return
	}
	if !record.valid() || (record.ID != "" && record.ID != id) {
		c.JSON(400, gin.H{"error": "Invalid shift"})
		return
	}
	record.ID = ""
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT (profile->>'firstName')||' '||(profile->>'lastName'),profile->>'department',profile->>'designation' FROM hr_staff WHERE id=$1 AND deleted_at IS NULL AND profile->>'status'='ACTIVE' FOR SHARE`, record.StaffID).Scan(&record.StaffName, &record.Department, &record.StaffRole); err != nil {
		operations.OperationError(c, err)
		return
	}
	raw, err := json.Marshal(record)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	user := c.GetString(auth.ContextUserID)
	if id == "" {
		err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO hr_shifts(staff_id,shift_date,details,created_by,updated_by) VALUES($1,$2,$3,$4,$4) RETURNING id`, record.StaffID, record.ShiftDate, raw, user).Scan(&id)
	} else {
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE hr_shifts SET staff_id=$2,shift_date=$3,details=$4,updated_by=$5,updated_at=CURRENT_TIMESTAMP WHERE id=$1`, id, record.StaffID, record.ShiftDate, raw, user)
	}
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if !operations.CommitOperation(c, tx, h.writer, "hr", action, "SHIFT", id, map[string]interface{}{"staffId": record.StaffID, "shiftDate": record.ShiftDate}) {
		return
	}
	record.ID = id
	c.JSON(status, record)
}
func (h *Handler) DeleteShift(c *gin.Context) {
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var id string
	err = tx.QueryRowContext(c.Request.Context(), `UPDATE hr_shifts SET deleted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP,updated_by=$2 WHERE id=$1 AND deleted_at IS NULL RETURNING id`, c.Param("id"), c.GetString(auth.ContextUserID)).Scan(&id)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "hr", "DELETE_SHIFT", "SHIFT", id, nil) {
		c.Status(http.StatusNoContent)
	}
}

type Leave struct {
	ID              string `json:"id"`
	StaffID         string `json:"staffId"`
	StaffName       string `json:"staffName"`
	Department      string `json:"department"`
	LeaveType       string `json:"leaveType"`
	StartDate       string `json:"startDate"`
	EndDate         string `json:"endDate"`
	TotalDays       int    `json:"totalDays"`
	Reason          string `json:"reason"`
	ReliefStaffID   string `json:"reliefStaffId,omitempty"`
	ReliefStaffName string `json:"reliefStaffName,omitempty"`
	Status          string `json:"status"`
	ApprovedBy      string `json:"approvedBy,omitempty"`
	ApprovalNotes   string `json:"approvalNotes,omitempty"`
	AppliedAt       string `json:"appliedAt"`
	ReviewedAt      string `json:"reviewedAt,omitempty"`
}

func (h *Handler) ListLeaves(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM hr_leaves WHERE deleted_at IS NULL AND ($1='' OR details->>'department'=$1) AND ($2='' OR details->>'status'=$2) AND ($3='' OR staff_id::text=$3) ORDER BY created_at DESC LIMIT 1000`, filter(c, "department"), filter(c, "status"), c.Query("staffId"))
}
func (h *Handler) CreateLeave(c *gin.Context) {
	var record Leave
	if !operations.BindOperation(c, &record) {
		return
	}
	if record.StaffID == "" || !date(record.StartDate) || !date(record.EndDate) || record.EndDate < record.StartDate || record.TotalDays <= 0 || strings.TrimSpace(record.Reason) == "" || !oneOf(record.LeaveType, "ANNUAL", "SICK", "MATERNITY", "PATERNITY", "STUDY", "CASUAL", "COMPASSIONATE") || (record.Status != "" && record.Status != "PENDING_HOD") || record.ApprovedBy != "" || record.ReviewedAt != "" {
		c.JSON(400, gin.H{"error": "Invalid leave request; approval is not configured"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT (profile->>'firstName')||' '||(profile->>'lastName'),profile->>'department' FROM hr_staff WHERE id=$1 AND deleted_at IS NULL FOR SHARE`, record.StaffID).Scan(&record.StaffName, &record.Department); err != nil {
		operations.OperationError(c, err)
		return
	}
	record.ID = ""
	record.Status = "PENDING_HOD"
	record.ApprovalNotes = ""
	record.AppliedAt = time.Now().UTC().Format(time.RFC3339Nano)
	raw, err := json.Marshal(record)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	user := c.GetString(auth.ContextUserID)
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO hr_leaves(staff_id,details,created_by,updated_by) VALUES($1,$2,$3,$3) RETURNING id`, record.StaffID, raw, user).Scan(&record.ID)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "hr", "CREATE_LEAVE", "LEAVE", record.ID, map[string]interface{}{"staffId": record.StaffID}) {
		c.JSON(201, record)
	}
}
func (h *Handler) Metrics(c *gin.Context) {
	var total, active, onLeave, expiring, shifts, leaves int
	err := h.db.QueryRowContext(c.Request.Context(), `SELECT count(*),count(*) FILTER(WHERE profile->>'status'='ACTIVE'),count(*) FILTER(WHERE profile->>'status'='ON_LEAVE'),count(*) FILTER(WHERE profile->>'licenseStatus'='EXPIRING_SOON') FROM hr_staff WHERE deleted_at IS NULL`).Scan(&total, &active, &onLeave, &expiring)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	err = h.db.QueryRowContext(c.Request.Context(), `SELECT (SELECT count(*) FROM hr_shifts WHERE deleted_at IS NULL AND shift_date=(CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::date AND details->>'status'='SCHEDULED'),(SELECT count(*) FROM hr_leaves WHERE deleted_at IS NULL AND details->>'status'='PENDING_HOD')`).Scan(&shifts, &leaves)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"totalStaff": total, "activeStaff": active, "onLeave": onLeave, "expiringLicensesCount": expiring, "activeShiftsToday": shifts, "pendingLeaveRequests": leaves})
}
