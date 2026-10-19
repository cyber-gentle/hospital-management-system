package reporting

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"hospital-hims/backend/core-go/internal/auth"
	"hospital-hims/backend/core-go/internal/common/operations"
	"time"
)

type Handler struct {
	db     *sql.DB
	tokens *auth.TokenService
}

func NewHandler(db *sql.DB, tokens *auth.TokenService) *Handler { return &Handler{db, tokens} }
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) {
	r := api.Group("/reporting", auth.AuthRequired(h.tokens), auth.RequirePermission(h.db, "reporting", "read"))
	r.GET("/overview", h.Overview)
}
func (h *Handler) Overview(c *gin.Context) {
	start, err := time.Parse("2006-01-02", c.Query("startDate"))
	if err != nil {
		c.JSON(400, gin.H{"error": "startDate must be YYYY-MM-DD (UTC)"})
		return
	}
	end, err := time.Parse("2006-01-02", c.Query("endDate"))
	if err != nil || end.Before(start) {
		c.JSON(400, gin.H{"error": "endDate must be YYYY-MM-DD (UTC), on or after startDate"})
		return
	}
	var issued, receipts decimal.Decimal
	var admissions, beds, occupied int
	// One statement provides a consistent database snapshot. Payment dates govern
	// receipts; invoice issue dates govern issued totals. Census is current.
	err = h.db.QueryRowContext(c.Request.Context(), `
 SELECT
 (SELECT COALESCE(SUM(total_amount),0) FROM invoices WHERE deleted_at IS NULL AND status IN ('UNPAID','PARTIAL','PAID') AND created_at >= $1 AND created_at < $2),
 (SELECT COALESCE(SUM(amount_paid),0) FROM payments WHERE deleted_at IS NULL AND status='COMPLETED' AND created_at >= $1 AND created_at < $2),
 (SELECT count(*) FROM admissions WHERE deleted_at IS NULL AND status='ADMITTED'),
 (SELECT count(*) FROM beds b JOIN wards w ON w.id=b.ward_id WHERE b.deleted_at IS NULL AND b.is_active AND w.deleted_at IS NULL AND w.is_active),
 (SELECT count(*) FROM beds b JOIN wards w ON w.id=b.ward_id WHERE b.deleted_at IS NULL AND b.is_active AND w.deleted_at IS NULL AND w.is_active AND b.status='OCCUPIED')
 `, start, end.AddDate(0, 0, 1)).Scan(&issued, &receipts, &admissions, &beds, &occupied)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"startDate": start.Format("2006-01-02"), "endDate": end.Format("2006-01-02"), "timeZone": "UTC", "invoiceTotalsIssued": issued.StringFixed(2), "completedReceipts": receipts.StringFixed(2), "currentAdmissions": admissions, "currentActiveBeds": beds, "currentOccupiedBeds": occupied, "generatedAt": time.Now().UTC()})
}
