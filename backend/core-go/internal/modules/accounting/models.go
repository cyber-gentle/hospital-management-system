package accounting

import (
	"time"

	"github.com/shopspring/decimal"
)

type ChartOfAccount struct {
	ID          string    `json:"id"`
	AccountCode string    `json:"account_code"`
	AccountName string    `json:"account_name"`
	AccountType string    `json:"account_type"`
	Description *string   `json:"description"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type JournalVoucher struct {
	ID            string         `json:"id"`
	VoucherNumber string         `json:"voucher_number"`
	Date          string         `json:"date"` // format: YYYY-MM-DD
	Reference     *string        `json:"reference"`
	Description   *string        `json:"description"`
	Status        string         `json:"status"`
	Entries       []JournalEntry `json:"entries,omitempty"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
}

type JournalEntry struct {
	ID          string          `json:"id"`
	VoucherID   string          `json:"voucher_id"`
	AccountID   string          `json:"account_id"`
	Debit       decimal.Decimal `json:"debit"`
	Credit      decimal.Decimal `json:"credit"`
	Description *string         `json:"description"`
}

type CreateAccountRequest struct {
	AccountCode string  `json:"account_code" binding:"required"`
	AccountName string  `json:"account_name" binding:"required"`
	AccountType string  `json:"account_type" binding:"required"`
	Description *string `json:"description"`
}

type CreateVoucherRequest struct {
	VoucherNumber string               `json:"voucher_number" binding:"required"`
	Date          string               `json:"date" binding:"required"`
	Reference     *string              `json:"reference"`
	Description   *string              `json:"description"`
	Entries       []CreateEntryRequest `json:"entries" binding:"required,min=2"`
}

type CreateEntryRequest struct {
	AccountID   string          `json:"account_id" binding:"required"`
	Debit       decimal.Decimal `json:"debit"`
	Credit      decimal.Decimal `json:"credit"`
	Description *string         `json:"description"`
}

type FinancialStatement struct {
	Accounts []AccountBalance `json:"accounts"`
	Total    decimal.Decimal  `json:"total"`
}

type AccountBalance struct {
	AccountID   string          `json:"account_id"`
	AccountCode string          `json:"account_code"`
	AccountName string          `json:"account_name"`
	Balance     decimal.Decimal `json:"balance"`
}
