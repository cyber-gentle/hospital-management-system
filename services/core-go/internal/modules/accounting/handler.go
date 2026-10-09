package accounting

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"

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
	acc := router.Group("/accounting")
	acc.Use(auth.AuthRequired(h.tokens))

	// Chart of Accounts
	acc.GET("/accounts", auth.RequirePermission(h.db, "accounting", "read"), h.HandleListAccounts)
	acc.POST("/accounts", auth.RequirePermission(h.db, "accounting", "write"), h.HandleCreateAccount)

	// Journal Vouchers
	acc.GET("/vouchers", auth.RequirePermission(h.db, "accounting", "read"), h.HandleListVouchers)
	acc.POST("/vouchers", auth.RequirePermission(h.db, "accounting", "write"), h.HandleCreateVoucher)
	acc.POST("/vouchers/:id/post", auth.RequirePermission(h.db, "accounting", "write"), h.HandlePostVoucher)

	// Statements
	acc.GET("/statements/trial-balance", auth.RequirePermission(h.db, "accounting", "read"), h.HandleTrialBalance)
}

func (h *Handler) HandleListAccounts(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT id, account_code, account_name, account_type, description, is_active, created_at, updated_at
		FROM chart_of_accounts
		WHERE deleted_at IS NULL
		ORDER BY account_code ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}
	defer rows.Close()

	var accounts []ChartOfAccount
	for rows.Next() {
		var a ChartOfAccount
		if err := rows.Scan(&a.ID, &a.AccountCode, &a.AccountName, &a.AccountType, &a.Description, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading account records"})
			return
		}
		accounts = append(accounts, a)
	}

	c.JSON(http.StatusOK, accounts)
}

func (h *Handler) HandleCreateAccount(c *gin.Context) {
	var req CreateAccountRequest
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

	var accountID string
	err = tx.QueryRow(`
		INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $5, $5)
		RETURNING id
	`, req.AccountCode, req.AccountName, req.AccountType, req.Description, userID).Scan(&accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "CREATE_ACCOUNT",
		Module:       "ACCOUNTING",
		ResourceID:   accountID,
		ResourceType: "CHART_OF_ACCOUNT",
		UserID:       &userID,
		Details:      map[string]interface{}{"account_code": req.AccountCode, "type": req.AccountType},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": accountID, "message": "Account created"})
}

func (h *Handler) HandleListVouchers(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT id, voucher_number, date, reference, description, status, created_at, updated_at
		FROM journal_vouchers
		WHERE deleted_at IS NULL
		ORDER BY date DESC, created_at DESC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch vouchers"})
		return
	}
	defer rows.Close()

	var vouchers []JournalVoucher
	for rows.Next() {
		var v JournalVoucher
		var d time.Time
		if err := rows.Scan(&v.ID, &v.VoucherNumber, &d, &v.Reference, &v.Description, &v.Status, &v.CreatedAt, &v.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading voucher records"})
			return
		}
		v.Date = d.Format("2006-01-02")
		vouchers = append(vouchers, v)
	}

	c.JSON(http.StatusOK, vouchers)
}

func (h *Handler) HandleCreateVoucher(c *gin.Context) {
	var req CreateVoucherRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload", "details": err.Error()})
		return
	}
	userID := c.GetString(auth.ContextUserID)

	// Validate debits == credits
	var totalDebit, totalCredit decimal.Decimal
	for _, e := range req.Entries {
		totalDebit = totalDebit.Add(e.Debit)
		totalCredit = totalCredit.Add(e.Credit)
	}
	if !totalDebit.Equal(totalCredit) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Total debits must equal total credits"})
		return
	}

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback()

	var voucherID string
	err = tx.QueryRow(`
		INSERT INTO journal_vouchers (voucher_number, date, reference, description, created_by, updated_by)
		VALUES ($1, $2, $3, $4, $5, $5)
		RETURNING id
	`, req.VoucherNumber, req.Date, req.Reference, req.Description, userID).Scan(&voucherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create voucher"})
		return
	}

	for _, e := range req.Entries {
		_, err = tx.Exec(`
			INSERT INTO journal_entries (voucher_id, account_id, debit, credit, description)
			VALUES ($1, $2, $3, $4, $5)
		`, voucherID, e.AccountID, e.Debit, e.Credit, e.Description)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create voucher entry"})
			return
		}
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "CREATE_VOUCHER",
		Module:       "ACCOUNTING",
		ResourceID:   voucherID,
		ResourceType: "JOURNAL_VOUCHER",
		UserID:       &userID,
		Details:      map[string]interface{}{"voucher_number": req.VoucherNumber, "amount": totalDebit.String()},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": voucherID, "message": "Journal voucher created"})
}

func (h *Handler) HandlePostVoucher(c *gin.Context) {
	voucherID := c.Param("id")
	userID := c.GetString(auth.ContextUserID)

	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}
	defer tx.Rollback()

	var status string
	err = tx.QueryRow(`SELECT status FROM journal_vouchers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, voucherID).Scan(&status)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Voucher not found"})
		return
	}

	if status != "DRAFT" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Voucher is already " + status})
		return
	}

	_, err = tx.Exec(`
		UPDATE journal_vouchers
		SET status = 'POSTED', posted_by = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $1
		WHERE id = $2
	`, userID, voucherID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update voucher status"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "POST_VOUCHER",
		Module:       "ACCOUNTING",
		ResourceID:   voucherID,
		ResourceType: "JOURNAL_VOUCHER",
		UserID:       &userID,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Voucher posted"})
}

func (h *Handler) HandleTrialBalance(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT a.id, a.account_code, a.account_name, 
		       COALESCE(SUM(e.debit), 0) - COALESCE(SUM(e.credit), 0) AS balance
		FROM chart_of_accounts a
		LEFT JOIN journal_entries e ON a.id = e.account_id
		LEFT JOIN journal_vouchers v ON e.voucher_id = v.id AND v.status = 'POSTED' AND v.deleted_at IS NULL
		WHERE a.deleted_at IS NULL
		GROUP BY a.id, a.account_code, a.account_name
		ORDER BY a.account_code ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate trial balance"})
		return
	}
	defer rows.Close()

	var balances []AccountBalance
	var total decimal.Decimal
	for rows.Next() {
		var b AccountBalance
		if err := rows.Scan(&b.AccountID, &b.AccountCode, &b.AccountName, &b.Balance); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading balances"})
			return
		}
		balances = append(balances, b)
		total = total.Add(b.Balance)
	}

	c.JSON(http.StatusOK, FinancialStatement{Accounts: balances, Total: total})
}
