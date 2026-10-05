package nursing

import (
	"time"
)

type Admission struct {
	ID                 string     `json:"id"`
	PatientID          string     `json:"patient_id"`
	WardID             string     `json:"ward_id"`
	BedID              string     `json:"bed_id"`
	AdmittedBy         string     `json:"admitted_by"`
	AdmittedAt         time.Time  `json:"admitted_at"`
	ReasonForAdmission *string    `json:"reason_for_admission,omitempty"`
	Status             string     `json:"status"`
	DischargedAt       *time.Time `json:"discharged_at,omitempty"`
	DischargedBy       *string    `json:"discharged_by,omitempty"`
	DischargeSummary   *string    `json:"discharge_summary,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

type CreateAdmissionRequest struct {
	PatientID          string  `json:"patient_id" binding:"required"`
	WardID             string  `json:"ward_id" binding:"required"`
	BedID              string  `json:"bed_id" binding:"required"`
	ReasonForAdmission *string `json:"reason_for_admission"`
}
