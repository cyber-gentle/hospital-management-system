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

type Vitals struct {
	ID              string     `json:"id"`
	PatientID       string     `json:"patient_id"`
	AdmissionID     *string    `json:"admission_id,omitempty"`
	RecordedBy      string     `json:"recorded_by"`
	Temperature     *float64   `json:"temperature,omitempty"`
	BloodPressure   *string    `json:"blood_pressure,omitempty"`
	PulseRate       *int       `json:"pulse_rate,omitempty"`
	RespiratoryRate *int       `json:"respiratory_rate,omitempty"`
	SpO2            *int       `json:"sp_o2,omitempty"`
	Weight          *float64   `json:"weight,omitempty"`
	Height          *float64   `json:"height,omitempty"`
	Notes           *string    `json:"notes,omitempty"`
	RecordedAt      time.Time  `json:"recorded_at"`
	CreatedAt       time.Time  `json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

type CreateVitalsRequest struct {
	PatientID       string   `json:"patient_id" binding:"required"`
	AdmissionID     *string  `json:"admission_id"`
	Temperature     *float64 `json:"temperature"`
	BloodPressure   *string  `json:"blood_pressure"`
	PulseRate       *int     `json:"pulse_rate"`
	RespiratoryRate *int     `json:"respiratory_rate"`
	SpO2            *int     `json:"sp_o2"`
	Weight          *float64 `json:"weight"`
	Height          *float64 `json:"height"`
	Notes           *string  `json:"notes"`
}

type NursingNote struct {
	ID          string    `json:"id"`
	PatientID   string    `json:"patient_id"`
	AdmissionID string    `json:"admission_id"`
	RecordedBy  string    `json:"recorded_by"`
	NoteType    string    `json:"note_type"`
	Notes       string    `json:"notes"`
	RecordedAt  time.Time `json:"recorded_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type CreateNursingNoteRequest struct {
	PatientID   string `json:"patient_id" binding:"required"`
	AdmissionID string `json:"admission_id" binding:"required"`
	NoteType    string `json:"note_type" binding:"required"`
	Notes       string `json:"notes" binding:"required"`
}
