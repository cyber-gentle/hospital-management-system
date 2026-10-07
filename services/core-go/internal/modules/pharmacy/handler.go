package pharmacy

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"

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
	ph := router.Group("/pharmacy")
	ph.Use(auth.AuthRequired(h.tokens))

	// Drugs / Stock
	ph.GET("/drugs/stock", auth.RequirePermission(h.db, "pharmacy", "read"), h.HandleGetStock)

	// Prescriptions
	ph.POST("/prescriptions", auth.RequirePermission(h.db, "pharmacy", "write"), h.HandleReceivePrescription)
	ph.POST("/prescriptions/check-interactions", auth.RequirePermission(h.db, "pharmacy", "read"), h.HandleCheckInteractions)
	ph.POST("/prescriptions/:id/dispense", auth.RequirePermission(h.db, "pharmacy", "write"), h.HandleDispense)
}

func (h *Handler) HandleGetStock(c *gin.Context) {
	// A simple query to get drugs and their stock
	rows, err := h.db.Query(`
		SELECT id, name, generic_name, unit, current_stock, reorder_level, unit_price, is_active, created_at, updated_at
		FROM pharmacy_drugs
		WHERE deleted_at IS NULL
		ORDER BY name ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch stock"})
		return
	}
	defer rows.Close()

	var drugs []Drug
	for rows.Next() {
		var d Drug
		if err := rows.Scan(&d.ID, &d.Name, &d.GenericName, &d.Unit, &d.CurrentStock, &d.ReorderLevel, &d.UnitPrice, &d.IsActive, &d.CreatedAt, &d.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading drug records"})
			return
		}
		drugs = append(drugs, d)
	}

	c.JSON(http.StatusOK, drugs)
}

func (h *Handler) HandleReceivePrescription(c *gin.Context) {
	var req CreatePrescriptionRequest
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

	// Insert Prescription
	var rxID string
	err = tx.QueryRow(`
		INSERT INTO pharmacy_prescriptions (patient_id, admission_id, doctor_id, status, notes, created_by, updated_by)
		VALUES ($1, $2, $3, 'PENDING', $4, $5, $5)
		RETURNING id
	`, req.PatientID, req.AdmissionID, req.DoctorID, req.Notes, userID).Scan(&rxID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create prescription"})
		return
	}

	// Insert Items
	for _, item := range req.Items {
		_, err = tx.Exec(`
			INSERT INTO pharmacy_prescription_items (prescription_id, drug_id, dosage, frequency, duration, quantity_prescribed, status, created_by, updated_by)
			VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7, $7)
		`, rxID, item.DrugID, item.Dosage, item.Frequency, item.Duration, item.QuantityPrescribed, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add prescription item"})
			return
		}
	}

	// Audit Log
	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "CREATE_PRESCRIPTION",
		Module:       "PHARMACY",
		ResourceID:   rxID,
		ResourceType: "PRESCRIPTION",
		UserID:       &userID,
		Details:      map[string]interface{}{"patient_id": req.PatientID, "items_count": len(req.Items)},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": rxID, "status": "PENDING", "message": "Prescription received"})
}

func (h *Handler) HandleCheckInteractions(c *gin.Context) {
	// FR-PH-02: Basic allergy/interaction check
	// A real implementation would query patient allergies and check drug interactions.
	// For now, this is a stub.
	var req struct {
		PatientID string   `json:"patient_id" binding:"required"`
		DrugIDs   []string `json:"drug_ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	// Stub response
	c.JSON(http.StatusOK, gin.H{
		"safe":     true,
		"warnings": []string{},
	})
}

func (h *Handler) HandleDispense(c *gin.Context) {
	prescriptionID := c.Param("id")
	var req DispenseRequest
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

	// Ensure prescription exists and is not cancelled/fully dispensed
	var currentStatus string
	err = tx.QueryRow(`SELECT status FROM pharmacy_prescriptions WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, prescriptionID).Scan(&currentStatus)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Prescription not found"})
		return
	}
	if currentStatus == "CANCELLED" || currentStatus == "DISPENSED" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Prescription cannot be dispensed (status: " + currentStatus + ")"})
		return
	}

	for _, item := range req.Items {
		// 1. Verify item belongs to prescription and is pending/partial
		var drugID string
		var qtyPrescribed, qtyDispensed int
		var itemStatus string
		err = tx.QueryRow(`
			SELECT drug_id, quantity_prescribed, quantity_dispensed, status
			FROM pharmacy_prescription_items
			WHERE id = $1 AND prescription_id = $2 AND deleted_at IS NULL
			FOR UPDATE
		`, item.PrescriptionItemID, prescriptionID).Scan(&drugID, &qtyPrescribed, &qtyDispensed, &itemStatus)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item not found or does not belong to prescription: " + item.PrescriptionItemID})
			return
		}
		if itemStatus == "DISPENSED" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Item already fully dispensed: " + item.PrescriptionItemID})
			return
		}
		if qtyDispensed+item.Quantity > qtyPrescribed {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot dispense more than prescribed for item: " + item.PrescriptionItemID})
			return
		}

		// 2. Check stock (FOR UPDATE)
		var currentStock int
		err = tx.QueryRow(`SELECT current_stock FROM pharmacy_drugs WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, drugID).Scan(&currentStock)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check stock for drug"})
			return
		}
		if currentStock < item.Quantity {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock for drug"})
			return
		}

		// 3. Deduct stock
		_, err = tx.Exec(`UPDATE pharmacy_drugs SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2 WHERE id = $3`, item.Quantity, userID, drugID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update stock"})
			return
		}

		// 4. Update item dispensed quantity and status
		newQtyDispensed := qtyDispensed + item.Quantity
		newItemStatus := "PARTIAL"
		if newQtyDispensed == qtyPrescribed {
			newItemStatus = "DISPENSED"
		}
		_, err = tx.Exec(`
			UPDATE pharmacy_prescription_items
			SET quantity_dispensed = $1, status = $2, updated_at = CURRENT_TIMESTAMP, updated_by = $3
			WHERE id = $4
		`, newQtyDispensed, newItemStatus, userID, item.PrescriptionItemID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item status"})
			return
		}

		// 5. Log dispensing
		_, err = tx.Exec(`
			INSERT INTO pharmacy_dispensing_logs (prescription_item_id, drug_id, quantity, dispensed_by, created_by, updated_by)
			VALUES ($1, $2, $3, $4, $4, $4)
		`, item.PrescriptionItemID, drugID, item.Quantity, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log dispensing"})
			return
		}
	}

	// 6. Update overall prescription status (PARTIAL or DISPENSED)
	// Check if any items are still pending or partial
	var incompleteCount int
	err = tx.QueryRow(`
		SELECT COUNT(*) FROM pharmacy_prescription_items
		WHERE prescription_id = $1 AND status != 'DISPENSED' AND deleted_at IS NULL
	`, prescriptionID).Scan(&incompleteCount)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify prescription completion status"})
		return
	}

	newRxStatus := "PARTIAL"
	if incompleteCount == 0 {
		newRxStatus = "DISPENSED"
	}
	_, err = tx.Exec(`
		UPDATE pharmacy_prescriptions
		SET status = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
		WHERE id = $3
	`, newRxStatus, userID, prescriptionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update prescription status"})
		return
	}

	// 7. Audit Log
	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "DISPENSE_PRESCRIPTION",
		Module:       "PHARMACY",
		ResourceID:   prescriptionID,
		ResourceType: "PRESCRIPTION",
		UserID:       &userID,
		Details:      map[string]interface{}{"status": newRxStatus, "items_dispensed": len(req.Items)},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Dispensing successful", "status": newRxStatus})
}
