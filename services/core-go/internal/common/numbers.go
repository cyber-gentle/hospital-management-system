package common

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

func NextNumber(ctx context.Context, tx *sql.Tx, prefix string) (string, error) {
	sequence := "financial_number_sequence"
	if prefix == "HIMS" {
		sequence = "hospital_number_sequence"
	}
	var value int64
	if err := tx.QueryRowContext(ctx, `SELECT nextval($1::regclass)`, sequence).Scan(&value); err != nil {
		return "", fmt.Errorf("allocate %s number: %w", prefix, err)
	}
	return fmt.Sprintf("%s-%d-%06d", prefix, time.Now().UTC().Year(), value), nil
}
