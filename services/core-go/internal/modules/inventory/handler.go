package inventory

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"hospital-hims/services/core-go/internal/auditlog"
	"hospital-hims/services/core-go/internal/auth"
	"hospital-hims/services/core-go/internal/common"
	"hospital-hims/services/core-go/internal/common/operations"
)

type Handler struct {
	db     *sql.DB
	writer *auditlog.Writer
	tokens *auth.TokenService
}

func NewHandler(db *sql.DB, writer *auditlog.Writer, tokens *auth.TokenService) *Handler {
	return &Handler{db, writer, tokens}
}
func (h *Handler) RegisterRoutes(api *gin.RouterGroup) {
	r := api.Group("/inventory")
	r.Use(auth.AuthRequired(h.tokens))
	r.GET("/items", auth.RequirePermission(h.db, "inventory", "read"), h.Items)
	r.POST("/items", auth.RequirePermission(h.db, "inventory", "write"), h.CreateItem)
	r.PATCH("/items/:id", auth.RequirePermission(h.db, "inventory", "write"), h.UpdateItem)
	r.POST("/items/:id/adjust", auth.RequirePermission(h.db, "inventory", "write"), h.Adjust)
	r.GET("/vendors", auth.RequirePermission(h.db, "inventory", "read"), h.Vendors)
	r.POST("/vendors", auth.RequirePermission(h.db, "inventory", "write"), h.CreateVendor)
	r.GET("/pos", auth.RequirePermission(h.db, "inventory", "read"), h.Orders)
	r.POST("/pos", auth.RequirePermission(h.db, "inventory", "write"), h.CreateOrder)
	r.PATCH("/pos/:id/status", auth.RequirePermission(h.db, "inventory", "approve"), operations.PolicyUnavailable(h.writer, "inventory", "PO_TRANSITION_BLOCKED", "Purchase-order approval rules are not configured; no order status was changed"))
	r.GET("/grns", auth.RequirePermission(h.db, "inventory", "read"), h.Receipts)
	r.POST("/grns", auth.RequirePermission(h.db, "inventory", "write"), operations.PolicyUnavailable(h.writer, "inventory", "GOODS_RECEIPT_BLOCKED", "Approved purchase-order receiving rules are not configured; no goods receipt or stock change was saved"))
	r.GET("/issuances", auth.RequirePermission(h.db, "inventory", "read"), h.Issuances)
	r.POST("/issuances", auth.RequirePermission(h.db, "inventory", "write"), operations.PolicyUnavailable(h.writer, "inventory", "ISSUANCE_BLOCKED", "Central-store to sub-store item mappings are not configured; no stock transfer was saved"))
	r.GET("/metrics", auth.RequirePermission(h.db, "inventory", "read"), h.Metrics)
}

type Item struct {
	ID            string       `json:"id"`
	ItemCode      string       `json:"itemCode"`
	Name          string       `json:"name"`
	Category      string       `json:"category"`
	Unit          string       `json:"unitOfMeasure"`
	Stock         int          `json:"currentStock"`
	Reorder       int          `json:"minimumReorderLevel"`
	Buffer        int          `json:"bufferStockLevel"`
	UnitCost      string       `json:"unitCost"`
	Cost          common.Money `json:"unitCostValue"`
	Bin           string       `json:"locationBin"`
	Vendor        string       `json:"preferredVendor"`
	Status        string       `json:"status"`
	LastRestocked string       `json:"lastRestocked"`
}

func oneOf(value string, options ...string) bool {
	for _, option := range options {
		if value == option {
			return true
		}
	}
	return false
}
func (i Item) valid() bool {
	return strings.TrimSpace(i.ItemCode) != "" && len(i.ItemCode) <= 100 && strings.TrimSpace(i.Name) != "" && len(i.Name) <= 255 && i.Stock >= 0 && i.Stock <= 2147483647 && i.Reorder >= 0 && i.Reorder <= 2147483647 && i.Buffer >= 0 && i.Buffer <= 2147483647 && i.Cost.ValidNonnegative() && strings.TrimSpace(i.Bin) != "" && oneOf(i.Category, "PHARMACEUTICALS", "CONSUMABLES", "SURGICAL_INSTRUMENTS", "LAB_REAGENTS", "GENERAL_STORES") && oneOf(i.Unit, "BOX", "VIAL", "PACK", "PIECE", "BOTTLE", "ROLL", "SET")
}
func (i *Item) derived() {
	i.UnitCost = "₦" + i.Cost.StringFixed(2)
	i.Status = "IN_STOCK"
	if i.Stock == 0 {
		i.Status = "OUT_OF_STOCK"
	} else if i.Stock <= i.Reorder {
		i.Status = "LOW_STOCK"
	}
}

const itemColumns = `id,item_code,name,category,unit_of_measure,current_stock,reorder_level,buffer_stock,unit_cost,location_bin,preferred_vendor,last_restocked`

type scanner interface{ Scan(...interface{}) error }

func scanItem(row scanner) (Item, error) {
	var i Item
	var cost string
	var restocked sql.NullTime
	err := row.Scan(&i.ID, &i.ItemCode, &i.Name, &i.Category, &i.Unit, &i.Stock, &i.Reorder, &i.Buffer, &cost, &i.Bin, &i.Vendor, &restocked)
	if err != nil {
		return i, err
	}
	amount, err := decimal.NewFromString(cost)
	if err != nil {
		return i, err
	}
	i.Cost = common.Money{Decimal: amount, Present: true}
	i.derived()
	if restocked.Valid {
		i.LastRestocked = restocked.Time.UTC().Format(time.RFC3339Nano)
	}
	return i, nil
}
func (h *Handler) Items(c *gin.Context) {
	rows, err := h.db.QueryContext(c.Request.Context(), `SELECT `+itemColumns+` FROM central_inventory_items WHERE deleted_at IS NULL AND ($1='' OR category=$1) AND ($2='' OR lower(name||' '||item_code) LIKE '%'||lower($2)||'%') ORDER BY item_code LIMIT 1000`, filter(c, "category"), c.Query("search"))
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer rows.Close()
	items := []Item{}
	for rows.Next() {
		item, err := scanItem(rows)
		if err != nil {
			operations.OperationError(c, err)
			return
		}
		if status := filter(c, "status"); status == "" || status == item.Status {
			items = append(items, item)
		}
	}
	if err := rows.Err(); err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, items)
}
func filter(c *gin.Context, key string) string {
	value := c.Query(key)
	if value == "ALL" {
		return ""
	}
	return value
}
func (h *Handler) CreateItem(c *gin.Context) {
	var item Item
	if !operations.BindOperation(c, &item) {
		return
	}
	if !item.valid() || !item.Cost.Present || item.Stock != 0 || item.ID != "" {
		c.JSON(400, gin.H{"error": "Invalid catalog item; opening stock must be recorded through an audited adjustment"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	item.LastRestocked = ""
	user := c.GetString(auth.ContextUserID)
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO central_inventory_items(item_code,name,category,unit_of_measure,current_stock,reorder_level,buffer_stock,unit_cost,location_bin,preferred_vendor,created_by,updated_by) VALUES($1,$2,$3,$4,0,$5,$6,$7,$8,$9,$10,$10) RETURNING id`, item.ItemCode, item.Name, item.Category, item.Unit, item.Reorder, item.Buffer, item.Cost.StringFixed(2), item.Bin, item.Vendor, user).Scan(&item.ID)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "inventory", "CREATE_ITEM", "INVENTORY_ITEM", item.ID, map[string]interface{}{"itemCode": item.ItemCode, "unitCost": item.Cost.StringFixed(2)}) {
		item.derived()
		c.JSON(201, item)
	}
}
func (h *Handler) UpdateItem(c *gin.Context) {
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	item, err := scanItem(tx.QueryRowContext(c.Request.Context(), `SELECT `+itemColumns+` FROM central_inventory_items WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, c.Param("id")))
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	stock := item.Stock
	restocked := item.LastRestocked
	id := item.ID
	if !operations.BindOperation(c, &item) {
		return
	}
	if !item.valid() || !item.Cost.Present || item.ID != id || item.Stock != stock {
		c.JSON(400, gin.H{"error": "Invalid catalog update; stock changes require the adjustment endpoint"})
		return
	}
	item.LastRestocked = restocked
	_, err = tx.ExecContext(c.Request.Context(), `UPDATE central_inventory_items SET item_code=$2,name=$3,category=$4,unit_of_measure=$5,reorder_level=$6,buffer_stock=$7,unit_cost=$8,location_bin=$9,preferred_vendor=$10,updated_by=$11,updated_at=CURRENT_TIMESTAMP WHERE id=$1`, id, item.ItemCode, item.Name, item.Category, item.Unit, item.Reorder, item.Buffer, item.Cost.StringFixed(2), item.Bin, item.Vendor, c.GetString(auth.ContextUserID))
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "inventory", "UPDATE_ITEM", "INVENTORY_ITEM", id, map[string]interface{}{"itemCode": item.ItemCode, "unitCost": item.Cost.StringFixed(2)}) {
		item.derived()
		c.JSON(200, item)
	}
}
func (h *Handler) Adjust(c *gin.Context) {
	var input struct {
		Quantity int    `json:"quantity"`
		Reason   string `json:"reason"`
	}
	if !operations.BindOperation(c, &input) {
		return
	}
	if input.Quantity == 0 || input.Quantity < -2147483647 || input.Quantity > 2147483647 || strings.TrimSpace(input.Reason) == "" || len(input.Reason) > 10000 {
		c.JSON(400, gin.H{"error": "Adjustment requires a nonzero integer quantity and reason"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	var oldStock int
	err = tx.QueryRowContext(c.Request.Context(), `SELECT current_stock FROM central_inventory_items WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`, c.Param("id")).Scan(&oldStock)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	newStock := int64(oldStock) + int64(input.Quantity)
	if newStock < 0 || newStock > 2147483647 {
		c.JSON(409, gin.H{"error": "Insufficient stock or stock limit exceeded"})
		return
	}
	item, err := scanItem(tx.QueryRowContext(c.Request.Context(), `UPDATE central_inventory_items SET current_stock=$2,updated_by=$3,updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING `+itemColumns, c.Param("id"), newStock, c.GetString(auth.ContextUserID)))
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "inventory", "ADJUST_STOCK", "INVENTORY_ITEM", item.ID, map[string]interface{}{"before": oldStock, "after": newStock, "quantity": input.Quantity, "reason": input.Reason}) {
		c.JSON(200, item)
	}
}

type Vendor struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Category string `json:"category"`
	Contact  string `json:"contactPerson"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	TaxID    string `json:"taxIdNumber"`
	Rating   int    `json:"rating"`
	Status   string `json:"status"`
}

func (h *Handler) Vendors(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM inventory_vendors WHERE deleted_at IS NULL ORDER BY details->>'name' LIMIT 1000`)
}
func (h *Handler) CreateVendor(c *gin.Context) {
	var vendor Vendor
	if !operations.BindOperation(c, &vendor) {
		return
	}
	if vendor.ID != "" || strings.TrimSpace(vendor.Name) == "" || !strings.Contains(vendor.Email, "@") || vendor.Rating < 1 || vendor.Rating > 5 || !oneOf(vendor.Status, "ACTIVE", "SUSPENDED") {
		c.JSON(400, gin.H{"error": "Invalid vendor"})
		return
	}
	raw, err := json.Marshal(vendor)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	err = tx.QueryRowContext(c.Request.Context(), `INSERT INTO inventory_vendors(details,created_by,updated_by) VALUES($1,$2,$2) RETURNING id`, raw, c.GetString(auth.ContextUserID)).Scan(&vendor.ID)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "inventory", "CREATE_VENDOR", "VENDOR", vendor.ID, map[string]interface{}{"name": vendor.Name}) {
		c.JSON(201, vendor)
	}
}

type OrderLine struct {
	ItemID    string       `json:"itemId"`
	ItemCode  string       `json:"itemCode"`
	ItemName  string       `json:"itemName"`
	Quantity  int          `json:"quantityOrdered"`
	UnitPrice common.Money `json:"unitPrice"`
	Total     common.Money `json:"totalPrice"`
}
type Order struct {
	ID             string       `json:"id"`
	Number         string       `json:"poNumber"`
	VendorID       string       `json:"vendorId"`
	VendorName     string       `json:"vendorName"`
	OrderDate      string       `json:"orderDate"`
	ExpectedDate   string       `json:"expectedDeliveryDate"`
	Items          []OrderLine  `json:"items"`
	TotalFormatted string       `json:"totalAmount"`
	Total          common.Money `json:"totalAmountValue"`
	Status         string       `json:"status"`
	Notes          string       `json:"approvalNotes,omitempty"`
	ApprovedBy     string       `json:"approvedBy,omitempty"`
	CreatedBy      string       `json:"createdBy"`
	CreatedAt      string       `json:"createdAt"`
}

func (h *Handler) Orders(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id,'status',status) FROM inventory_purchase_orders WHERE deleted_at IS NULL AND ($1='' OR status=$1) ORDER BY created_at DESC,id LIMIT 1000`, filter(c, "status"))
}
func (h *Handler) CreateOrder(c *gin.Context) {
	var order Order
	if !operations.BindOperation(c, &order) {
		return
	}
	_, startErr := time.Parse("2006-01-02", order.OrderDate)
	_, endErr := time.Parse("2006-01-02", order.ExpectedDate)
	if order.ID != "" || order.VendorID == "" || len(order.Items) == 0 || len(order.Items) > 500 || startErr != nil || endErr != nil || order.ExpectedDate < order.OrderDate || (order.Status != "" && order.Status != "DRAFT") || order.ApprovedBy != "" {
		c.JSON(400, gin.H{"error": "Invalid draft order; approval is not configured"})
		return
	}
	tx, err := h.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	defer common.Rollback(tx)
	err = tx.QueryRowContext(c.Request.Context(), `SELECT details->>'name' FROM inventory_vendors WHERE id=$1 AND deleted_at IS NULL AND details->>'status'='ACTIVE' FOR SHARE`, order.VendorID).Scan(&order.VendorName)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	total := decimal.Zero
	seen := map[string]bool{}
	for index := range order.Items {
		line := &order.Items[index]
		if line.ItemID == "" || seen[line.ItemID] || line.Quantity <= 0 || line.Quantity > 2147483647 || !line.UnitPrice.Present || !line.UnitPrice.ValidNonnegative() || !line.UnitPrice.IsPositive() {
			c.JSON(400, gin.H{"error": "Order lines require distinct catalog items, positive quantities and decimal prices"})
			return
		}
		seen[line.ItemID] = true
		err = tx.QueryRowContext(c.Request.Context(), `SELECT item_code,name FROM central_inventory_items WHERE id=$1 AND deleted_at IS NULL FOR SHARE`, line.ItemID).Scan(&line.ItemCode, &line.ItemName)
		if err != nil {
			operations.OperationError(c, err)
			return
		}
		line.Total = common.Money{Decimal: line.UnitPrice.Mul(decimal.NewFromInt(int64(line.Quantity)))}
		total = total.Add(line.Total.Decimal)
	}
	order.Total = common.Money{Decimal: total}
	if !order.Total.ValidNonnegative() {
		c.JSON(400, gin.H{"error": "Order total exceeds supported monetary range"})
		return
	}
	if err := tx.QueryRowContext(c.Request.Context(), `SELECT gen_random_uuid()::text`).Scan(&order.ID); err != nil {
		operations.OperationError(c, err)
		return
	}
	order.Number = "PO-" + order.ID
	order.Status = "DRAFT"
	order.ApprovedBy = ""
	order.Notes = ""
	order.CreatedBy = c.GetString(auth.ContextUsername)
	order.CreatedAt = time.Now().UTC().Format(time.RFC3339Nano)
	order.TotalFormatted = "₦" + order.Total.StringFixed(2)
	raw, err := json.Marshal(order)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	user := c.GetString(auth.ContextUserID)
	_, err = tx.ExecContext(c.Request.Context(), `INSERT INTO inventory_purchase_orders(id,po_number,vendor_id,total_amount,status,details,created_by,updated_by) VALUES($1,$2,$3,$4,'DRAFT',$5,$6,$6)`, order.ID, order.Number, order.VendorID, order.Total.StringFixed(2), raw, user)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	if operations.CommitOperation(c, tx, h.writer, "inventory", "CREATE_PURCHASE_ORDER", "PURCHASE_ORDER", order.ID, map[string]interface{}{"total": order.Total.StringFixed(2), "lineCount": len(order.Items)}) {
		c.JSON(http.StatusCreated, order)
	}
}
func (h *Handler) Receipts(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM inventory_goods_receipts WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1000`)
}
func (h *Handler) Issuances(c *gin.Context) {
	operations.ListDocuments(c, h.db, `SELECT details || jsonb_build_object('id',id) FROM inventory_issuances WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1000`)
}
func (h *Handler) Metrics(c *gin.Context) {
	var total, low, empty, orders, issuances int
	var value string
	err := h.db.QueryRowContext(c.Request.Context(), `SELECT count(*),count(*) FILTER(WHERE current_stock>0 AND current_stock<=reorder_level),count(*) FILTER(WHERE current_stock=0),COALESCE(sum(current_stock*unit_cost),0)::text FROM central_inventory_items WHERE deleted_at IS NULL`).Scan(&total, &low, &empty, &value)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	amount, err := decimal.NewFromString(value)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	err = h.db.QueryRowContext(c.Request.Context(), `SELECT (SELECT count(*) FROM inventory_purchase_orders WHERE deleted_at IS NULL AND status IN ('SUBMITTED_FOR_APPROVAL','APPROVED')),(SELECT count(*) FROM inventory_issuances WHERE deleted_at IS NULL AND details->>'status'='DISPATCHED')`).Scan(&orders, &issuances)
	if err != nil {
		operations.OperationError(c, err)
		return
	}
	c.JSON(200, gin.H{"totalCatalogItems": total, "totalInventoryValue": "₦" + amount.StringFixed(2), "lowStockCount": low, "outOfStockCount": empty, "pendingPurchaseOrders": orders, "pendingSubstoreRequests": issuances})
}
