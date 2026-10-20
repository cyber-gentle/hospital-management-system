package common

import (
	"database/sql"
	"errors"
	"log"
)

// Rollback is intended for defer after BeginTx. A successfully committed
// transaction is already closed; any other rollback error must be visible.
func Rollback(tx *sql.Tx) {
	if err := tx.Rollback(); err != nil && !errors.Is(err, sql.ErrTxDone) {
		log.Printf("[TRANSACTION] rollback failed: %v", err)
	}
}
