package substore

import (
	"time"
)

type SubStore struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Department string    `json:"department"`
	IsActive   bool      `json:"is_active"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type SubStoreInventory struct {
	ID           string    `json:"id"`
	SubStoreID   string    `json:"sub_store_id"`
	ItemName     string    `json:"item_name"`
	CurrentStock int       `json:"current_stock"`
	ReorderLevel int       `json:"reorder_level"`
	Unit         string    `json:"unit"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Requisition struct {
	ID         string            `json:"id"`
	SubStoreID string            `json:"sub_store_id"`
	Status     string            `json:"status"`
	Notes      *string           `json:"notes"`
	Items      []RequisitionItem `json:"items,omitempty"`
	CreatedAt  time.Time         `json:"created_at"`
	UpdatedAt  time.Time         `json:"updated_at"`
}

type RequisitionItem struct {
	ID                string `json:"id"`
	RequisitionID     string `json:"requisition_id"`
	ItemName          string `json:"item_name"`
	QuantityRequested int    `json:"quantity_requested"`
	QuantityFulfilled int    `json:"quantity_fulfilled"`
}

type CreateRequisitionRequest struct {
	SubStoreID string                         `json:"sub_store_id" binding:"required"`
	Notes      *string                        `json:"notes"`
	Items      []CreateRequisitionItemRequest `json:"items" binding:"required,min=1"`
}

type CreateRequisitionItemRequest struct {
	ItemName          string `json:"item_name" binding:"required"`
	QuantityRequested int    `json:"quantity_requested" binding:"required,gt=0"`
}

type FulfillRequisitionRequest struct {
	Items []FulfillRequisitionItemRequest `json:"items" binding:"required,min=1"`
}

type FulfillRequisitionItemRequest struct {
	ItemID            string `json:"item_id" binding:"required"`
	QuantityFulfilled int    `json:"quantity_fulfilled" binding:"required,min=0"`
}

type StockAdjustmentRequest struct {
	ItemName string `json:"item_name" binding:"required"`
	Quantity int    `json:"quantity" binding:"required"` // Can be positive or negative
	Reason   string `json:"reason" binding:"required"`
}
