package billing

import (
	"fmt"
	"strings"

	"github.com/shopspring/decimal"
)

// All stored amounts use NUMERIC(12,2). Reject precision loss instead of
// silently rounding an input before collecting or crediting money.
func validateAmount(amount decimal.Decimal, positive bool) error {
	if amount.IsNegative() || (positive && amount.IsZero()) {
		if positive {
			return fmt.Errorf("amount must be positive")
		}
		return fmt.Errorf("amount must be non-negative")
	}
	if !amount.Equal(amount.Round(2)) {
		return fmt.Errorf("amount must have at most two decimal places")
	}
	if amount.GreaterThan(decimal.RequireFromString("9999999999.99")) {
		return fmt.Errorf("amount exceeds the supported monetary range")
	}
	return nil
}

func validateInvoice(req CreateInvoiceRequest) error {
	if err := validateAmount(req.Tax, false); err != nil {
		return fmt.Errorf("tax: %w", err)
	}
	if err := validateAmount(req.Discount, false); err != nil {
		return fmt.Errorf("discount: %w", err)
	}
	if len(req.LineItems) == 0 {
		return fmt.Errorf("at least one invoice item is required")
	}
	var subtotal, covered decimal.Decimal
	for _, item := range req.LineItems {
		if strings.TrimSpace(item.Description) == "" || strings.TrimSpace(item.Department) == "" || item.Quantity < 1 {
			return fmt.Errorf("invoice items require a description, department and positive quantity")
		}
		if err := validateAmount(item.UnitPrice, false); err != nil {
			return fmt.Errorf("unit price: %w", err)
		}
		if err := validateAmount(item.NHIACoveredAmount, false); err != nil {
			return fmt.Errorf("NHIA coverage: %w", err)
		}
		gross := item.UnitPrice.Mul(decimal.NewFromInt(int64(item.Quantity)))
		if item.NHIACoveredAmount.GreaterThan(gross) {
			return fmt.Errorf("NHIA coverage cannot exceed the item charge")
		}
		subtotal = subtotal.Add(gross)
		covered = covered.Add(item.NHIACoveredAmount)
	}
	total := subtotal.Add(req.Tax).Sub(req.Discount)
	if err := validateAmount(total, false); err != nil {
		return fmt.Errorf("invoice total: %w", err)
	}
	if covered.GreaterThan(total) {
		return fmt.Errorf("NHIA coverage cannot exceed the invoice total after discounts")
	}
	return nil
}
