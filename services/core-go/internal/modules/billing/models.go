package billing

import (
	"time"

	"github.com/shopspring/decimal"
)

type Invoice struct {
	ID             string            `json:"id"`
	InvoiceNumber  string            `json:"invoice_number"`
	PatientID      string            `json:"patient_id"`
	AdmissionID    *string           `json:"admission_id,omitempty"`
	Subtotal       decimal.Decimal   `json:"subtotal"`
	Tax            decimal.Decimal   `json:"tax"`
	Discount       decimal.Decimal   `json:"discount"`
	NHIACoverage   decimal.Decimal   `json:"nhia_coverage"`
	TotalAmount    decimal.Decimal   `json:"total_amount"`
	PaidAmount     decimal.Decimal   `json:"paid_amount"`
	BalanceDue     decimal.Decimal   `json:"balance_due"`
	Status         string            `json:"status"`
	CreatedBy      string            `json:"created_by"`
	DueDate        *time.Time        `json:"due_date,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
	UpdatedAt      time.Time         `json:"updated_at"`
	LineItems      []InvoiceLineItem `json:"line_items,omitempty"`
}

type InvoiceLineItem struct {
	ID                   string          `json:"id"`
	InvoiceID            string          `json:"invoice_id"`
	Description          string          `json:"description"`
	Department           string          `json:"department"`
	Quantity             int             `json:"quantity"`
	UnitPrice            decimal.Decimal `json:"unit_price"`
	TotalPrice           decimal.Decimal `json:"total_price"`
	NHIACoveredAmount    decimal.Decimal `json:"nhia_covered_amount"`
	PatientPayableAmount decimal.Decimal `json:"patient_payable_amount"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

type CreateInvoiceRequest struct {
	PatientID   string                   `json:"patient_id" binding:"required"`
	AdmissionID *string                  `json:"admission_id"`
	Discount    decimal.Decimal          `json:"discount"`
	Tax         decimal.Decimal          `json:"tax"`
	DueDate     *time.Time               `json:"due_date"`
	LineItems   []CreateLineItemRequest  `json:"line_items" binding:"required,min=1"`
}

type CreateLineItemRequest struct {
	Description       string          `json:"description" binding:"required"`
	Department        string          `json:"department" binding:"required"`
	Quantity          int             `json:"quantity" binding:"required,min=1"`
	UnitPrice         decimal.Decimal `json:"unit_price" binding:"required"`
	NHIACoveredAmount decimal.Decimal `json:"nhia_covered_amount"`
}

type Payment struct {
	ID               string          `json:"id"`
	ReceiptNumber    string          `json:"receipt_number"`
	InvoiceID        *string         `json:"invoice_id,omitempty"`
	PatientID        string          `json:"patient_id"`
	AmountPaid       decimal.Decimal `json:"amount_paid"`
	PaymentMethod    string          `json:"payment_method"`
	PaymentReference *string         `json:"payment_reference,omitempty"`
	ProcessedBy      string          `json:"processed_by"`
	Status           string          `json:"status"`
	CreatedAt        time.Time       `json:"created_at"`
	UpdatedAt        time.Time       `json:"updated_at"`
}

type CreatePaymentRequest struct {
	InvoiceID        *string         `json:"invoice_id"`
	PatientID        string          `json:"patient_id" binding:"required"`
	AmountPaid       decimal.Decimal `json:"amount_paid" binding:"required"`
	PaymentMethod    string          `json:"payment_method" binding:"required"`
	PaymentReference *string         `json:"payment_reference"`
}

type AdmissionDeposit struct {
	ID             string          `json:"id"`
	AdmissionID    string          `json:"admission_id"`
	PatientID      string          `json:"patient_id"`
	RequiredAmount decimal.Decimal `json:"required_amount"`
	PaidAmount     decimal.Decimal `json:"paid_amount"`
	IsCleared      bool            `json:"is_cleared"`
	ClearedBy      *string         `json:"cleared_by,omitempty"`
	ClearedAt      *time.Time      `json:"cleared_at,omitempty"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

type Wallet struct {
	ID                   string          `json:"id"`
	PatientID            string          `json:"patient_id"`
	HospitalNumber       string          `json:"hospital_number"`
	VirtualAccountNumber string          `json:"virtual_account_number"`
	Balance              decimal.Decimal `json:"balance"`
	CreatedAt            time.Time       `json:"created_at"`
	UpdatedAt            time.Time       `json:"updated_at"`
}

type WalletTransaction struct {
	ID              string          `json:"id"`
	WalletID        string          `json:"wallet_id"`
	TransactionType string          `json:"transaction_type"` // CREDIT, DEBIT
	Amount          decimal.Decimal `json:"amount"`
	Reference       string          `json:"reference"`
	ProcessedBy     string          `json:"processed_by"` // UUID or 'SYSTEM_WEBHOOK'
	CreatedAt       time.Time       `json:"created_at"`
}

type FundWalletManualRequest struct {
	PatientID     string          `json:"patient_id" binding:"required"`
	Amount        decimal.Decimal `json:"amount" binding:"required"`
	PaymentMethod string          `json:"payment_method" binding:"required"` // 'CASH', 'POS'
	Reference     string          `json:"reference" binding:"required"`      // Receipt/Teller No
}

type WebhookPayload struct {
	Event string `json:"event"`
	Data  struct {
		VirtualAccountNumber string          `json:"virtual_account_number"`
		Amount               decimal.Decimal `json:"amount"`
		Reference            string          `json:"reference"` // Payment Gateway Trx ID
	} `json:"data"`
}

type UpdateInvoiceStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

type DeleteInvoiceRequest struct {
	Password string `json:"password" binding:"required"`
	Reason   string `json:"reason" binding:"required"`
}

type RecordAdmissionDepositRequest struct {
	AdmissionID   string          `json:"admission_id" binding:"required"`
	PatientID     string          `json:"patient_id" binding:"required"`
	AmountPaid    decimal.Decimal `json:"amount_paid" binding:"required"`
	PaymentMethod string          `json:"payment_method" binding:"required"` // CASH, POS, WALLET
	Reference     string          `json:"reference"`
}
