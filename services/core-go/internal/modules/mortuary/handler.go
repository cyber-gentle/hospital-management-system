package mortuary

import (
	"database/sql"
	"encoding/json"
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
	r := api.Group("/mortuary")
	r.Use(auth.AuthRequired(h.tokens))
	r.GET("/deceased", auth.RequirePermission(h.db, "mortuary", "read"), h.Deceased)
	r.POST("/admit", auth.RequirePermission(h.db, "mortuary", "write"), h.Admit)
	r.GET("/chambers", auth.RequirePermission(h.db, "mortuary", "read"), h.Chambers)
	r.POST("/chambers/:id/assign", auth.RequirePermission(h.db, "mortuary", "write"), operations.PolicyUnavailable(h.writer, "mortuary", "CHAMBER_ASSIGNMENT_BLOCKED", "Cold-storage slots have not been provisioned; no chamber assignment was saved"))
	r.POST("/chambers/:id/release", auth.RequirePermission(h.db, "mortuary", "write"), operations.PolicyUnavailable(h.writer, "mortuary", "CHAMBER_RELEASE_BLOCKED", "Body-release rules are not configured; no chamber was released"))
	r.GET("/autopsies", auth.RequirePermission(h.db, "mortuary", "read"), h.Autopsies)
	r.POST("/autopsies", auth.RequirePermission(h.db, "mortuary", "write"), h.CreateAutopsy)
	r.GET("/releases", auth.RequirePermission(h.db, "mortuary", "read"), h.Releases)
	r.POST("/releases", auth.RequirePermission(h.db, "mortuary", "approve"), operations.PolicyUnavailable(h.writer, "mortuary", "BODY_RELEASE_BLOCKED", "Payment and coroner release rules are not configured; no body release was saved"))
}

type Kin struct {
	Name         string `json:"name"`
	Phone        string `json:"phone"`
	Relationship string `json:"relationship"`
	Address      string `json:"address"`
	NationalID   string `json:"nationalIdNumber"`
}
type Deceased struct {
	ID              string        `json:"id"`
	Tag             string        `json:"deceasedTagNumber"`
	FullName        string        `json:"fullName"`
	Unidentified    bool          `json:"isUnidentified"`
	HospitalNumber  string        `json:"hospitalNumber"`
	Age             int           `json:"age"`
	Gender          string        `json:"gender"`
	Admission       string        `json:"dateOfAdmission"`
	Origin          string        `json:"originDepartment"`
	Death           string        `json:"dateOfDeath"`
	Cause           string        `json:"causeOfDeath"`
	Doctor          string        `json:"certifyingDoctor"`
	DoctorLicense   string        `json:"certifyingDoctorLicense"`
	CoronerCase     bool          `json:"isCoronerCase"`
	PoliceReference string        `json:"policeRefNumber,omitempty"`
	Kin             Kin           `json:"nextOfKin"`
	ChamberID       string        `json:"assignedChamberId,omitempty"`
	ChamberUnit     string        `json:"assignedChamberUnit,omitempty"`
	Status          string        `json:"status"`
	Belongings      []string      `json:"belongingsDeposited"`
	Rate            common.Money  `json:"storageFeeDaily"`
	Days            *int          `json:"daysInStorage"`
	Accrued         *common.Money `json:"totalAccruedStorageFee"`
	Paid            bool          `json:"financialClearancePaid"`
	AutopsyID       string        `json:"autopsyId,omitempty"`
	ReleaseID       string        `json:"releaseId,omitempty"`
	UpdatedAt       string        `json:"updatedAt"`
	BillingStatus   string        `json:"storageBillingStatus"`
}

func oneOf(value string, options ...string) bool {
	for _, option := range options {
		if option == value {
			return true
		}
	}
	return false
}
func parseTime(value string) (time.Time, error) {
	if stamp, err := time.Parse(time.RFC3339, value); err == nil {
		return stamp.UTC(), nil
	}
	return time.Parse("2006-01-02", value)
}
func (h *Handler) Deceased(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id,'deceasedTagNumber',tag_number,'updatedAt',updated_at,'daysInStorage',NULL,'totalAccruedStorageFee',NULL,'storageBillingStatus','NOT_CONFIGURED') FROM mortuary_deceased WHERE deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 1000`)
}
func (h *Handler) Chambers(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM mortuary_chambers WHERE deleted_at IS NULL ORDER BY created_at,id LIMIT 1000`)
}
func (h *Handler) Admit(c *gin.Context) {
	var record Deceased
	if !operations.BindOperation(c, &record) {
		return
	}
	admission, admissionErr := parseTime(record.Admission)
	death, deathErr := parseTime(record.Death)
	if record.ID != "" || record.Age < 0 || record.Age > 130 || strings.TrimSpace(record.FullName) == "" || admissionErr != nil || deathErr != nil || admission.Before(death) || admission.After(time.Now().UTC()) || !oneOf(record.Gender, "MALE", "FEMALE", "OTHER") || !oneOf(record.Origin, "INPATIENT_WARD", "ACCIDENT_EMERGENCY", "OPERATING_THEATRE", "BROUGHT_IN_DEAD_BID", "POLICE_CASE") || !record.Rate.Present || !record.Rate.ValidNonnegative() || record.Paid || record.ReleaseID != "" || record.AutopsyID != "" || record.ChamberID != "" || record.ChamberUnit != "" || (record.Status != "" && record.Status != "ADMITTED_IN_STORAGE" && record.Status != "AUTOPSY_PENDING") {
		c.JSON(400, gin.H{"error": "Invalid intake; billing clearance, release and chamber allocation cannot be supplied by the client"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT gen_random_uuid()::text`).Scan(&record.ID); err != nil {
		operations.OperationError(c, err)
		return
	}
	record.Tag = "TAG-" + record.ID
	record.Status = "ADMITTED_IN_STORAGE"
	if record.CoronerCase {
		record.Status = "AUTOPSY_PENDING"
	}
	record.Paid = false
	record.Days = nil
	record.Accrued = nil
	record.BillingStatus = "NOT_CONFIGURED"
	record.UpdatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	record.Admission = admission.Format(time.RFC3339)
	record.Death = death.Format(time.RFC3339)
	if record.Belongings == nil {
		record.Belongings = []string{}
	}
	raw, err := json.Marshal(record)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	user := c.GetString(auth.ContextUserID)
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO mortuary_deceased(id,tag_number,daily_rate,details,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$5)`, record.ID, record.Tag, record.Rate.StringFixed(2), raw, user)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "mortuary", "ADMIT_DECEASED", "DECEASED", record.ID, map[string]interface{}{"tag": record.Tag, "coronerCase": record.CoronerCase, "recordedDailyRate": record.Rate.StringFixed(2), "billingConfigured": false}) {
		c.JSON(201, record)
	}
}

type Autopsy struct {
	ID              string   `json:"id"`
	DeceasedID      string   `json:"deceasedId"`
	DeceasedName    string   `json:"deceasedName"`
	DeceasedTag     string   `json:"deceasedTagNumber"`
	PathologistName string   `json:"pathologistName"`
	License         string   `json:"pathologistLicense"`
	Date            string   `json:"autopsyDate"`
	External        string   `json:"externalFindings"`
	Internal        string   `json:"internalFindings"`
	Cause           string   `json:"definitiveCauseOfDeath"`
	Samples         []string `json:"toxicologySamplesRetained"`
	Verdict         string   `json:"coronerVerdict"`
}

func (h *Handler) Autopsies(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM mortuary_autopsies WHERE deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 1000`)
}
func (h *Handler) CreateAutopsy(c *gin.Context) {
	var record Autopsy
	if !operations.BindOperation(c, &record) {
		return
	}
	performed, err := parseTime(record.Date)
	if err != nil || performed.After(time.Now().UTC()) || record.ID != "" || record.DeceasedID == "" || strings.TrimSpace(record.PathologistName) == "" || strings.TrimSpace(record.License) == "" || strings.TrimSpace(record.Cause) == "" || strings.TrimSpace(record.External) == "" || strings.TrimSpace(record.Internal) == "" {
		c.JSON(400, gin.H{"error": "Invalid autopsy record"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var deceasedRaw []byte
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT details FROM mortuary_deceased WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, record.DeceasedID).Scan(&deceasedRaw); err != nil {
		operations.OperationError(c, err)
		return
	}
	var deceased Deceased
	if err := json.Unmarshal(deceasedRaw, &deceased); err != nil {
		operations.OperationError(c, err)
		return
	}
	death, err := parseTime(deceased.Death)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if deceased.ReleaseID != "" || deceased.AutopsyID != "" || deceased.Status == "RELEASED_TO_FAMILY" || performed.Before(death) {
		c.JSON(409, gin.H{"error": "Autopsy cannot be recorded for this deceased record"})
		return
	}
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT gen_random_uuid()::text`).Scan(&record.ID); err != nil {
		operations.OperationError(c, err)
		return
	}
	record.DeceasedName = deceased.FullName
	record.DeceasedTag = deceased.Tag
	record.Date = performed.UTC().Format(time.RFC3339)
	if record.Samples == nil {
		record.Samples = []string{}
	}
	raw, err := json.Marshal(record)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	user := c.GetString(auth.ContextUserID)
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO mortuary_autopsies(id,deceased_id,details,created_by,updated_by) VALUES($1,$2,$3,$4,$4)`, record.ID, record.DeceasedID, raw, user)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	deceased.AutopsyID = record.ID
	deceased.Status = "AUTOPSY_COMPLETED"
	deceased.UpdatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	raw, err = json.Marshal(deceased)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE mortuary_deceased SET details=$2,updated_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$1`, record.DeceasedID, raw, user)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "mortuary", "RECORD_AUTOPSY", "AUTOPSY", record.ID, map[string]interface{}{"deceasedId": record.DeceasedID}) {
		c.JSON(201, record)
	}
}
func (h *Handler) Releases(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM mortuary_releases WHERE deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 1000`)
}
