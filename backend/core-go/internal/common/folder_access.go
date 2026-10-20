package common

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type folderQuerier interface {
	QueryRowContext(context.Context, string, ...interface{}) *sql.Row
}

// PatientFolderAccess also covers requests that omit an admission identifier.
func PatientFolderAccess(c *gin.Context, db folderQuerier, patientID string) bool {
	var blocked bool
	err := db.QueryRowContext(c.Request.Context(), `SELECT EXISTS (
		SELECT 1 FROM admissions a JOIN wards w ON w.id=a.ward_id
		WHERE a.patient_id=$1 AND a.status='ADMITTED' AND a.deleted_at IS NULL AND NOT w.is_accident_emergency
		AND NOT EXISTS (SELECT 1 FROM admission_deposits d WHERE d.admission_id=a.id AND d.patient_id=a.patient_id AND d.paid_amount>0 AND d.deleted_at IS NULL))`, patientID).Scan(&blocked)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Unable to verify clinical folder access"})
		return false
	}
	if blocked {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": "A positive admission deposit is required before clinical folder access"})
		return false
	}
	return true
}

// AdmissionFolderAccess enforces the recorded deposit rule inside the same
// transaction as the clinical write and verifies patient/admission ownership.
func AdmissionFolderAccess(c *gin.Context, tx *sql.Tx, admissionID, patientID string) bool {
	var owner string
	var cleared bool
	err := tx.QueryRowContext(c.Request.Context(), `SELECT a.patient_id::text,
		w.is_accident_emergency OR EXISTS (SELECT 1 FROM admission_deposits d WHERE d.admission_id=a.id AND d.patient_id=a.patient_id AND d.paid_amount>0 AND d.deleted_at IS NULL)
		FROM admissions a JOIN wards w ON w.id=a.ward_id
		WHERE a.id=$1 AND a.deleted_at IS NULL AND w.deleted_at IS NULL FOR SHARE OF a,w`, admissionID).Scan(&owner, &cleared)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Admission not found"})
		return false
	}
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Unable to verify clinical folder access"})
		return false
	}
	if patientID != "" && owner != patientID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admission does not belong to this patient"})
		return false
	}
	if !cleared {
		c.JSON(http.StatusPaymentRequired, gin.H{"error": "A positive admission deposit is required before clinical folder access"})
		return false
	}
	return true
}
