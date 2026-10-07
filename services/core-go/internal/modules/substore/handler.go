package substore

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
	ss := router.Group("/substores")
	ss.Use(auth.AuthRequired(h.tokens))

	// Sub-store info
	ss.GET("/", auth.RequirePermission(h.db, "substores", "read"), h.HandleListSubStores)
	ss.GET("/:id/inventory", auth.RequirePermission(h.db, "substores", "read"), h.HandleGetInventory)
	ss.POST("/:id/adjust", auth.RequirePermission(h.db, "substores", "write"), h.HandleAdjustStock)

	// Requisitions
	ss.POST("/requisitions", auth.RequirePermission(h.db, "substores", "write"), h.HandleCreateRequisition)
	ss.POST("/requisitions/:id/fulfill", auth.RequirePermission(h.db, "substores", "write"), h.HandleFulfillRequisition)
}

func (h *Handler) HandleListSubStores(c *gin.Context) {
	rows, err := h.db.Query(`
		SELECT id, name, department, is_active, created_at, updated_at
		FROM sub_stores
		WHERE deleted_at IS NULL
		ORDER BY name ASC
	`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch sub-stores"})
		return
	}
	defer rows.Close()

	var stores []SubStore
	for rows.Next() {
		var s SubStore
		if err := rows.Scan(&s.ID, &s.Name, &s.Department, &s.IsActive, &s.CreatedAt, &s.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading records"})
			return
		}
		stores = append(stores, s)
	}
	c.JSON(http.StatusOK, stores)
}

func (h *Handler) HandleGetInventory(c *gin.Context) {
	storeID := c.Param("id")
	rows, err := h.db.Query(`
		SELECT id, sub_store_id, item_name, current_stock, reorder_level, unit, updated_at
		FROM sub_store_inventory
		WHERE sub_store_id = $1 AND deleted_at IS NULL
		ORDER BY item_name ASC
	`, storeID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inventory"})
		return
	}
	defer rows.Close()

	var inventory []SubStoreInventory
	for rows.Next() {
		var inv SubStoreInventory
		if err := rows.Scan(&inv.ID, &inv.SubStoreID, &inv.ItemName, &inv.CurrentStock, &inv.ReorderLevel, &inv.Unit, &inv.UpdatedAt); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading records"})
			return
		}
		inventory = append(inventory, inv)
	}
	c.JSON(http.StatusOK, inventory)
}

func (h *Handler) HandleCreateRequisition(c *gin.Context) {
	var req CreateRequisitionRequest
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

	var reqID string
	err = tx.QueryRow(`
		INSERT INTO sub_store_requisitions (sub_store_id, status, notes, created_by, updated_by)
		VALUES ($1, 'PENDING', $2, $3, $3)
		RETURNING id
	`, req.SubStoreID, req.Notes, userID).Scan(&reqID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create requisition"})
		return
	}

	for _, item := range req.Items {
		_, err = tx.Exec(`
			INSERT INTO sub_store_requisition_items (requisition_id, item_name, quantity_requested)
			VALUES ($1, $2, $3)
		`, reqID, item.ItemName, item.QuantityRequested)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add items"})
			return
		}
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "CREATE_REQUISITION",
		Module:       "SUBSTORES",
		ResourceID:   reqID,
		ResourceType: "REQUISITION",
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

	c.JSON(http.StatusCreated, gin.H{"id": reqID, "message": "Requisition created"})
}

func (h *Handler) HandleFulfillRequisition(c *gin.Context) {
	reqID := c.Param("id")
	var req FulfillRequisitionRequest
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

	var status, storeID string
	err = tx.QueryRow(`SELECT status, sub_store_id FROM sub_store_requisitions WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, reqID).Scan(&status, &storeID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Requisition not found"})
		return
	}

	if status != "PENDING" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only PENDING requisitions can be fulfilled"})
		return
	}

	for _, reqItem := range req.Items {
		var itemName string
		err = tx.QueryRow(`
			UPDATE sub_store_requisition_items
			SET quantity_fulfilled = $1
			WHERE id = $2 AND requisition_id = $3
			RETURNING item_name
		`, reqItem.QuantityFulfilled, reqItem.ItemID, reqID).Scan(&itemName)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update item fulfillment"})
			return
		}

		// Update sub-store inventory
		_, err = tx.Exec(`
			INSERT INTO sub_store_inventory (sub_store_id, item_name, current_stock, reorder_level, unit, updated_by)
			VALUES ($1, $2, $3, 0, 'units', $4)
			ON CONFLICT (sub_store_id, item_name)
			DO UPDATE SET current_stock = sub_store_inventory.current_stock + EXCLUDED.current_stock, updated_at = CURRENT_TIMESTAMP, updated_by = $4
		`, storeID, itemName, reqItem.QuantityFulfilled, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update inventory"})
			return
		}
	}

	_, err = tx.Exec(`
		UPDATE sub_store_requisitions
		SET status = 'FULFILLED', updated_at = CURRENT_TIMESTAMP, updated_by = $1
		WHERE id = $2
	`, userID, reqID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update requisition status"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "FULFILL_REQUISITION",
		Module:       "SUBSTORES",
		ResourceID:   reqID,
		ResourceType: "REQUISITION",
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

	c.JSON(http.StatusOK, gin.H{"message": "Requisition fulfilled"})
}

func (h *Handler) HandleAdjustStock(c *gin.Context) {
	storeID := c.Param("id")
	var req StockAdjustmentRequest
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

	// Update sub-store inventory
	var newStock int
	err = tx.QueryRow(`
		UPDATE sub_store_inventory 
		SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
		WHERE sub_store_id = $3 AND item_name = $4 AND deleted_at IS NULL
		RETURNING current_stock
	`, req.Quantity, userID, storeID, req.ItemName).Scan(&newStock)
	if err != nil {
		// Could be that item doesn't exist in store yet
		c.JSON(http.StatusBadRequest, gin.H{"error": "Item not found in sub-store or insufficient stock to reduce"})
		return
	}

	err = h.auditWriter.RecordTx(c.Request.Context(), tx, auditlog.Entry{
		Action:       "ADJUST_STOCK",
		Module:       "SUBSTORES",
		ResourceID:   storeID,
		ResourceType: "SUBSTORE",
		UserID:       &userID,
		Details:      map[string]interface{}{"item": req.ItemName, "adjustment": req.Quantity, "new_stock": newStock, "reason": req.Reason},
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write audit log"})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock adjusted successfully", "new_stock": newStock})
}

