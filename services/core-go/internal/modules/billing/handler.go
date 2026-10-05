package billing

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"golang.org/x/crypto/bcrypt"

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
	billing := router.Group("/billing")

	// Unprotected webhook route
	billing.POST("/webhooks/payments", h.HandlePaymentWebhook)

	// Protected routes
	protected := billing.Group("")
	protected.Use(auth.AuthRequired(h.tokens))

	protected.POST("/invoices", auth.RequirePermission(h.db, "billing", "write"), h.HandleCreateInvoice)
	protected.POST("/invoices/consolidate", auth.RequirePermission(h.db, "billing", "write"), h.HandleConsolidateCharges)
	protected.GET("/invoices", auth.RequirePermission(h.db, "billing", "read"), h.HandleListInvoices)
	protected.GET("/invoices/:id", auth.RequirePermission(h.db, "billing", "read"), h.HandleGetInvoice)
	protected.PUT("/invoices/:id/status", auth.RequirePermission(h.db, "billing", "write"), h.HandleUpdateInvoiceStatus)
	protected.DELETE("/invoices/:id", auth.RequirePermission(h.db, "billing", "delete"), h.HandleDeleteInvoice)

	protected.POST("/payments", h.HandleCreatePayment)
	protected.POST("/wallets/fund", h.HandleFundWalletManual)
	
	protected.POST("/admission-deposits", h.HandleRecordAdmissionDeposit)
}

func (h *Handler) HandleCreateInvoice(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input: " + err.Error()})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	// Generate Invoice Number
	invNo := fmt.Sprintf("INV-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)

	var subtotal, totalNHIA decimal.Decimal
	for _, li := range req.LineItems {
		totalPrice := li.UnitPrice.Mul(decimal.NewFromInt(int64(li.Quantity)))
		subtotal = subtotal.Add(totalPrice)
		totalNHIA = totalNHIA.Add(li.NHIACoveredAmount)
	}

	totalAmount := subtotal.Add(req.Tax).Sub(req.Discount)
	if totalAmount.IsNegative() {
		totalAmount = decimal.Zero
	}
	balanceDue := totalAmount.Sub(totalNHIA)
	if balanceDue.IsNegative() {
		balanceDue = decimal.Zero
	}

	query := `
		INSERT INTO invoices (
			invoice_number, patient_id, admission_id, subtotal, tax, discount,
			nhia_coverage, total_amount, paid_amount, balance_due, status, created_by, due_date
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0.00, $9, 'UNPAID', $10, $11)
		RETURNING id, created_at, updated_at
	`

	var inv Invoice
	inv.InvoiceNumber = invNo
	inv.PatientID = req.PatientID
	inv.AdmissionID = req.AdmissionID
	inv.Subtotal = subtotal
	inv.Tax = req.Tax
	inv.Discount = req.Discount
	inv.NHIACoverage = totalNHIA
	inv.TotalAmount = totalAmount
	inv.PaidAmount = decimal.Zero
	inv.BalanceDue = balanceDue
	inv.Status = "UNPAID"
	inv.CreatedBy = userID
	inv.DueDate = req.DueDate

	err = tx.QueryRowContext(c.Request.Context(), query,
		invNo, req.PatientID, req.AdmissionID, subtotal, req.Tax, req.Discount,
		totalNHIA, totalAmount, balanceDue, userID, req.DueDate,
	).Scan(&inv.ID, &inv.CreatedAt, &inv.UpdatedAt)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	// Insert line items
	liQuery := `
		INSERT INTO invoice_line_items (
			invoice_id, description, department, quantity, unit_price, total_price,
			nhia_covered_amount, patient_payable_amount
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	for _, li := range req.LineItems {
		totalPrice := li.UnitPrice.Mul(decimal.NewFromInt(int64(li.Quantity)))
		patientPayable := totalPrice.Sub(li.NHIACoveredAmount)
		if patientPayable.IsNegative() {
			patientPayable = decimal.Zero
		}

		var savedLi InvoiceLineItem
		savedLi.InvoiceID = inv.ID
		savedLi.Description = li.Description
		savedLi.Department = li.Department
		savedLi.Quantity = li.Quantity
		savedLi.UnitPrice = li.UnitPrice
		savedLi.TotalPrice = totalPrice
		savedLi.NHIACoveredAmount = li.NHIACoveredAmount
		savedLi.PatientPayableAmount = patientPayable

		err = tx.QueryRowContext(c.Request.Context(), liQuery,
			inv.ID, li.Description, li.Department, li.Quantity, li.UnitPrice,
			totalPrice, li.NHIACoveredAmount, patientPayable,
		).Scan(&savedLi.ID, &savedLi.CreatedAt, &savedLi.UpdatedAt)
		
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert line item"})
			return
		}
		inv.LineItems = append(inv.LineItems, savedLi)
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "CREATE_INVOICE",
		ResourceType: "Invoice",
		ResourceID:   inv.ID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"invoice_number": invNo,
			"total_amount":   totalAmount.String(),
		},
	})

	c.JSON(http.StatusCreated, inv)
}

func (h *Handler) HandleCreatePayment(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req CreatePaymentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	receiptNo := fmt.Sprintf("RCP-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)

	if req.PaymentMethod == "WALLET" {
		var walletID string
		var currentBalance decimal.Decimal
		err = tx.QueryRowContext(c.Request.Context(), `SELECT id, balance FROM wallets WHERE patient_id = $1 FOR UPDATE`, req.PatientID).Scan(&walletID, &currentBalance)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wallet"})
			}
			return
		}

		if currentBalance.LessThan(req.AmountPaid) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient wallet balance"})
			return
		}

		newBalance := currentBalance.Sub(req.AmountPaid)
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, newBalance, walletID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wallet balance"})
			return
		}

		wtQuery := `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, reference, processed_by) VALUES ($1, $2, $3, $4, $5)`
		_, err = tx.ExecContext(c.Request.Context(), wtQuery, walletID, "DEBIT", req.AmountPaid, receiptNo, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log wallet transaction"})
			return
		}
	}

	var p Payment
	p.ReceiptNumber = receiptNo
	p.InvoiceID = req.InvoiceID
	p.PatientID = req.PatientID
	p.AmountPaid = req.AmountPaid
	p.PaymentMethod = req.PaymentMethod
	p.PaymentReference = req.PaymentReference
	p.ProcessedBy = userID
	p.Status = "COMPLETED"

	query := `
		INSERT INTO payments (
			receipt_number, invoice_id, patient_id, amount_paid, payment_method, payment_reference, processed_by, status
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`
	err = tx.QueryRowContext(c.Request.Context(), query,
		receiptNo, req.InvoiceID, req.PatientID, req.AmountPaid, req.PaymentMethod, req.PaymentReference, userID, "COMPLETED",
	).Scan(&p.ID, &p.CreatedAt, &p.UpdatedAt)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process payment"})
		return
	}

	// Update invoice if linked
	if req.InvoiceID != nil {
		var currentPaid, totalAmount decimal.Decimal
		err = tx.QueryRowContext(c.Request.Context(), `SELECT paid_amount, total_amount FROM invoices WHERE id = $1 FOR UPDATE`, *req.InvoiceID).Scan(&currentPaid, &totalAmount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice"})
			return
		}

		newPaid := currentPaid.Add(req.AmountPaid)
		newBalance := totalAmount.Sub(newPaid)
		status := "PARTIAL"
		if newBalance.LessThanOrEqual(decimal.Zero) {
			status = "PAID"
			newBalance = decimal.Zero
		}

		_, err = tx.ExecContext(c.Request.Context(), `UPDATE invoices SET paid_amount = $1, balance_due = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`, newPaid, newBalance, status, *req.InvoiceID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice balances"})
			return
		}
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "CREATE_PAYMENT",
		ResourceType: "Payment",
		ResourceID:   p.ID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"receipt_number": receiptNo,
			"amount_paid":    req.AmountPaid.String(),
			"invoice_id":     req.InvoiceID,
		},
	})

	c.JSON(http.StatusCreated, p)
}

func (h *Handler) HandleFundWalletManual(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	if userRole != "CASHIER" && userRole != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Unauthorized role"})
		return
	}

	var req FundWalletManualRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	var walletID string
	var currentBalance decimal.Decimal
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id, balance FROM wallets WHERE patient_id = $1 FOR UPDATE`, req.PatientID).Scan(&walletID, &currentBalance)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wallet"})
		}
		return
	}

	newBalance := currentBalance.Add(req.Amount)
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, newBalance, walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wallet balance"})
		return
	}

	var wt WalletTransaction
	query := `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, reference, processed_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err = tx.QueryRowContext(c.Request.Context(), query, walletID, "CREDIT", req.Amount, req.Reference, userID).Scan(&wt.ID, &wt.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log wallet transaction"})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "FUND_WALLET_MANUAL",
		ResourceType: "Wallet",
		ResourceID:   walletID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"amount": req.Amount.String(),
			"method": req.PaymentMethod,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Wallet funded successfully", "new_balance": newBalance, "transaction_id": wt.ID})
}

func (h *Handler) HandlePaymentWebhook(c *gin.Context) {
	var payload WebhookPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	if payload.Event != "charge.success" && payload.Event != "transfer.success" {
		c.JSON(http.StatusOK, gin.H{"message": "Event ignored"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	var walletID string
	var currentBalance decimal.Decimal
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id, balance FROM wallets WHERE virtual_account_number = $1 FOR UPDATE`, payload.Data.VirtualAccountNumber).Scan(&walletID, &currentBalance)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found for virtual account"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wallet"})
		}
		return
	}

	newBalance := currentBalance.Add(payload.Data.Amount)
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, newBalance, walletID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wallet balance"})
		return
	}

	var wt WalletTransaction
	query := `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, reference, processed_by) VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`
	err = tx.QueryRowContext(c.Request.Context(), query, walletID, "CREDIT", payload.Data.Amount, payload.Data.Reference, "SYSTEM_WEBHOOK").Scan(&wt.ID, &wt.CreatedAt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log wallet transaction"})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	sysUser := "SYSTEM"
	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &sysUser,
		UserName:     "SYSTEM_WEBHOOK",
		UserRole:     "SYSTEM",
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "FUND_WALLET_WEBHOOK",
		ResourceType: "Wallet",
		ResourceID:   walletID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"amount": payload.Data.Amount.String(),
			"reference": payload.Data.Reference,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Webhook processed successfully", "new_balance": newBalance, "transaction_id": wt.ID})
}

func (h *Handler) HandleListInvoices(c *gin.Context) {
	status := c.Query("status")
	patientID := c.Query("patient_id")

	query := `SELECT id, invoice_number, patient_id, admission_id, subtotal, tax, discount, nhia_coverage, total_amount, paid_amount, balance_due, status, created_by, due_date, created_at, updated_at FROM invoices WHERE deleted_at IS NULL`
	args := []interface{}{}
	argIdx := 1

	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}
	if patientID != "" {
		query += fmt.Sprintf(" AND patient_id = $%d", argIdx)
		args = append(args, patientID)
		argIdx++
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.db.QueryContext(c.Request.Context(), query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query invoices"})
		return
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var inv Invoice
		if err := rows.Scan(
			&inv.ID, &inv.InvoiceNumber, &inv.PatientID, &inv.AdmissionID,
			&inv.Subtotal, &inv.Tax, &inv.Discount, &inv.NHIACoverage,
			&inv.TotalAmount, &inv.PaidAmount, &inv.BalanceDue, &inv.Status,
			&inv.CreatedBy, &inv.DueDate, &inv.CreatedAt, &inv.UpdatedAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse invoices"})
			return
		}
		invoices = append(invoices, inv)
	}
	c.JSON(http.StatusOK, invoices)
}

func (h *Handler) HandleGetInvoice(c *gin.Context) {
	id := c.Param("id")

	var inv Invoice
	err := h.db.QueryRowContext(c.Request.Context(), `
		SELECT id, invoice_number, patient_id, admission_id, subtotal, tax, discount, nhia_coverage, total_amount, paid_amount, balance_due, status, created_by, due_date, created_at, updated_at 
		FROM invoices WHERE id = $1 AND deleted_at IS NULL
	`, id).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.PatientID, &inv.AdmissionID,
		&inv.Subtotal, &inv.Tax, &inv.Discount, &inv.NHIACoverage,
		&inv.TotalAmount, &inv.PaidAmount, &inv.BalanceDue, &inv.Status,
		&inv.CreatedBy, &inv.DueDate, &inv.CreatedAt, &inv.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invoice"})
		}
		return
	}

	rows, err := h.db.QueryContext(c.Request.Context(), `
		SELECT id, invoice_id, description, department, quantity, unit_price, total_price, nhia_covered_amount, patient_payable_amount, created_at, updated_at
		FROM invoice_line_items WHERE invoice_id = $1 AND deleted_at IS NULL
	`, inv.ID)
	
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var li InvoiceLineItem
			rows.Scan(
				&li.ID, &li.InvoiceID, &li.Description, &li.Department, &li.Quantity,
				&li.UnitPrice, &li.TotalPrice, &li.NHIACoveredAmount, &li.PatientPayableAmount,
				&li.CreatedAt, &li.UpdatedAt,
			)
			inv.LineItems = append(inv.LineItems, li)
		}
	}

	c.JSON(http.StatusOK, inv)
}

func (h *Handler) HandleUpdateInvoiceStatus(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req UpdateInvoiceStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	_, err := h.db.ExecContext(c.Request.Context(), `UPDATE invoices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND deleted_at IS NULL`, req.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "UPDATE_INVOICE_STATUS",
		ResourceType: "Invoice",
		ResourceID:   id,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"new_status": req.Status,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Invoice status updated"})
}

func (h *Handler) HandleDeleteInvoice(c *gin.Context) {
	id := c.Param("id")
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req DeleteInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Verify password
	var hashedPassword string
	err := h.db.QueryRowContext(c.Request.Context(), `SELECT password_hash FROM users WHERE id = $1 AND deleted_at IS NULL`, userID).Scan(&hashedPassword)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Failed to verify user credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	res, err := tx.ExecContext(c.Request.Context(), `UPDATE invoices SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}
	rowsAffected, _ := res.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found or already deleted"})
		return
	}

	_, err = tx.ExecContext(c.Request.Context(), `UPDATE invoice_line_items SET deleted_at = CURRENT_TIMESTAMP WHERE invoice_id = $1 AND deleted_at IS NULL`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice line items"})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "DELETE_INVOICE",
		ResourceType: "Invoice",
		ResourceID:   id,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"reason": req.Reason,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
}

func (h *Handler) HandleRecordAdmissionDeposit(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req RecordAdmissionDepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}
	defer tx.Rollback()

	if req.PaymentMethod == "WALLET" {
		var walletID string
		var currentBalance decimal.Decimal
		err = tx.QueryRowContext(c.Request.Context(), `SELECT id, balance FROM wallets WHERE patient_id = $1 FOR UPDATE`, req.PatientID).Scan(&walletID, &currentBalance)
		if err != nil {
			if err == sql.ErrNoRows {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Wallet not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch wallet"})
			}
			return
		}

		if currentBalance.LessThan(req.AmountPaid) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient wallet balance"})
			return
		}

		newBalance := currentBalance.Sub(req.AmountPaid)
		_, err = tx.ExecContext(c.Request.Context(), `UPDATE wallets SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, newBalance, walletID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update wallet balance"})
			return
		}

		wtQuery := `INSERT INTO wallet_transactions (wallet_id, transaction_type, amount, reference, processed_by) VALUES ($1, $2, $3, $4, $5)`
		_, err = tx.ExecContext(c.Request.Context(), wtQuery, walletID, "DEBIT", req.AmountPaid, req.Reference, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log wallet transaction"})
			return
		}
	}

	// Upsert the admission deposit
	var currentPaid decimal.Decimal
	var depositID string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT id, paid_amount FROM admission_deposits WHERE admission_id = $1 FOR UPDATE`, req.AdmissionID).Scan(&depositID, &currentPaid)

	var newPaid decimal.Decimal
	if err == sql.ErrNoRows {
		newPaid = req.AmountPaid
		err = tx.QueryRowContext(c.Request.Context(), `
			INSERT INTO admission_deposits (admission_id, patient_id, paid_amount, is_cleared, cleared_by, cleared_at)
			VALUES ($1, $2, $3, true, $4, CURRENT_TIMESTAMP)
			RETURNING id
		`, req.AdmissionID, req.PatientID, newPaid, userID).Scan(&depositID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to record deposit"})
			return
		}
	} else if err == nil {
		newPaid = currentPaid.Add(req.AmountPaid)
		_, err = tx.ExecContext(c.Request.Context(), `
			UPDATE admission_deposits SET paid_amount = $1, is_cleared = true, cleared_by = $2, cleared_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
			WHERE id = $3
		`, newPaid, userID, depositID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update deposit"})
			return
		}
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch deposit record"})
		return
	}

	// Insert payment record
	receiptNo := fmt.Sprintf("DEP-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)
	_, err = tx.ExecContext(c.Request.Context(), `
		INSERT INTO payments (receipt_number, patient_id, amount_paid, payment_method, payment_reference, processed_by, status)
		VALUES ($1, $2, $3, $4, $5, $6, 'COMPLETED')
	`, receiptNo, req.PatientID, req.AmountPaid, req.PaymentMethod, req.Reference, userID)
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log payment"})
		return
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "RECORD_ADMISSION_DEPOSIT",
		ResourceType: "AdmissionDeposit",
		ResourceID:   depositID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"amount_paid": req.AmountPaid.String(),
			"admission_id": req.AdmissionID,
		},
	})

	c.JSON(http.StatusOK, gin.H{"message": "Admission deposit recorded successfully", "deposit_id": depositID})
}

func (h *Handler) HandleConsolidateCharges(c *gin.Context) {
	userID := c.GetString(auth.ContextUserID)
	userName := c.GetString(auth.ContextUsername)
	userRole := c.GetString(auth.ContextUserRole)

	var req ConsolidateChargesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start tx"})
		return
	}
	defer tx.Rollback()

	var patientID string
	err = tx.QueryRowContext(c.Request.Context(), `SELECT patient_id FROM admissions WHERE id = $1 AND deleted_at IS NULL`, req.AdmissionID).Scan(&patientID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admission not found"})
		return
	}

	rows, err := tx.QueryContext(c.Request.Context(), `
		SELECT id, task_type, description
		FROM nursing_tasks 
		WHERE admission_id = $1 AND status = 'COMPLETED' AND deleted_at IS NULL
	`, req.AdmissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to query nursing tasks"})
		return
	}
	defer rows.Close()

	var subtotal decimal.Decimal
	var lineItems []InvoiceLineItem

	for rows.Next() {
		var taskID, taskType, desc string
		if err := rows.Scan(&taskID, &taskType, &desc); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan tasks"})
			return
		}

		cost := decimal.NewFromInt(50) 
		
		subtotal = subtotal.Add(cost)
		lineItems = append(lineItems, InvoiceLineItem{
			Description: fmt.Sprintf("[%s] %s", taskType, desc),
			Department:  "NURSING",
			Quantity:    1,
			UnitPrice:   cost,
			TotalPrice:  cost,
			PatientPayableAmount: cost,
		})
	}

	if len(lineItems) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No billable nursing tasks found for this admission"})
		return
	}

	invNo := fmt.Sprintf("INV-%d-%06d", time.Now().Year(), time.Now().UnixNano()%1000000)
	totalAmount := subtotal

	var invID string
	err = tx.QueryRowContext(c.Request.Context(), `
		INSERT INTO invoices (invoice_number, patient_id, admission_id, subtotal, total_amount, balance_due, status, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, 'UNPAID', $7)
		RETURNING id
	`, invNo, patientID, req.AdmissionID, subtotal, totalAmount, totalAmount, userID).Scan(&invID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	for _, li := range lineItems {
		_, err = tx.ExecContext(c.Request.Context(), `
			INSERT INTO invoice_line_items (invoice_id, description, department, quantity, unit_price, total_price, patient_payable_amount)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, invID, li.Description, li.Department, li.Quantity, li.UnitPrice, li.TotalPrice, li.PatientPayableAmount)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert line item"})
			return
		}
	}

	if err = tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit tx"})
		return
	}

	h.auditWriter.Record(c.Request.Context(), auditlog.Entry{
		UserID:       &userID,
		UserName:     userName,
		UserRole:     userRole,
		Service:      "core-go",
		Module:       "accounts-billing",
		Action:       "CONSOLIDATE_CHARGES",
		ResourceType: "Invoice",
		ResourceID:   invID,
		Status:       "SUCCESS",
		Details: map[string]interface{}{
			"admission_id": req.AdmissionID,
			"total_amount": totalAmount.String(),
		},
	})

	c.JSON(http.StatusCreated, gin.H{"message": "Charges consolidated successfully", "invoice_id": invID})
}
