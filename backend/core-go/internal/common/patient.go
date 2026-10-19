package common

import (
	"database/sql"
	"github.com/gin-gonic/gin"
	"net/http"
)

func ActivePatient(c *gin.Context, tx *sql.Tx, id string) bool {
	var patient string
	err := tx.QueryRowContext(c.Request.Context(), `SELECT id::text FROM patients WHERE id=$1 AND is_active=true AND deleted_at IS NULL FOR SHARE`, id).Scan(&patient)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Active patient not found"})
		return false
	}
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Unable to verify patient"})
		return false
	}
	return true
}
