package pharmacy

import (
	"time"

	"github.com/shopspring/decimal"
)

type Drug struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	GenericName  *string         `json:"generic_name"`
	Unit         string          `json:"unit"`
	CurrentStock int             `json:"current_stock"`
	ReorderLevel int             `json:"reorder_level"`
	UnitPrice    decimal.Decimal `json:"unit_price"`
	IsActive     bool            `json:"is_active"`
	CreatedBy    *string         `json:"created_by,omitempty"`
	UpdatedBy    *string         `json:"updated_by,omitempty"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

type Prescription struct {
	ID          string             `json:"id"`
	PatientID   string             `json:"patient_id"`
	AdmissionID *string            `json:"admission_id,omitempty"`
	DoctorID    *string            `json:"doctor_id,omitempty"`
	Status      string             `json:"status"` // PENDING, PARTIAL, DISPENSED, CANCELLED
	Notes       *string            `json:"notes,omitempty"`
	Items       []PrescriptionItem `json:"items,omitempty"`
	CreatedBy   *string            `json:"created_by,omitempty"`
	UpdatedBy   *string            `json:"updated_by,omitempty"`
	CreatedAt   time.Time          `json:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at"`
}

type PrescriptionItem struct {
	ID                 string    `json:"id"`
	PrescriptionID     string    `json:"prescription_id"`
	DrugID             string    `json:"drug_id"`
	Dosage             string    `json:"dosage"`
	Frequency          string    `json:"frequency"`
	Duration           string    `json:"duration"`
	QuantityPrescribed int       `json:"quantity_prescribed"`
	QuantityDispensed  int       `json:"quantity_dispensed"`
	Status             string    `json:"status"` // PENDING, DISPENSED
	CreatedBy          *string   `json:"created_by,omitempty"`
	UpdatedBy          *string   `json:"updated_by,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

type CreatePrescriptionRequest struct {
	PatientID   string                          `json:"patient_id" binding:"required"`
	AdmissionID *string                         `json:"admission_id"`
	DoctorID    *string                         `json:"doctor_id"`
	Notes       *string                         `json:"notes"`
	Items       []CreatePrescriptionItemRequest `json:"items" binding:"required,min=1"`
}

type CreatePrescriptionItemRequest struct {
	DrugID             string `json:"drug_id" binding:"required"`
	Dosage             string `json:"dosage" binding:"required"`
	Frequency          string `json:"frequency" binding:"required"`
	Duration           string `json:"duration" binding:"required"`
	QuantityPrescribed int    `json:"quantity_prescribed" binding:"required,gt=0"`
}

type DispenseRequest struct {
	Items []DispenseItemRequest `json:"items" binding:"required,min=1"`
}

type DispenseItemRequest struct {
	PrescriptionItemID string `json:"prescription_item_id" binding:"required"`
	Quantity           int    `json:"quantity" binding:"required,gt=0"`
}
