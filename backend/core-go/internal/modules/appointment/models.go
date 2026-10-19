package appointment

import (
	"time"
)

type DoctorAvailability struct {
	ID        string    `json:"id"`
	DoctorID  string    `json:"doctor_id"`
	DayOfWeek int       `json:"day_of_week"`
	StartTime string    `json:"start_time"`
	EndTime   string    `json:"end_time"`
	IsActive  bool      `json:"is_active"`
	CreatedBy *string   `json:"created_by,omitempty"`
	UpdatedBy *string   `json:"updated_by,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Appointment struct {
	ID              string    `json:"id"`
	PatientID       string    `json:"patient_id"`
	DoctorID        *string   `json:"doctor_id,omitempty"`
	Department      string    `json:"department"`
	AppointmentDate string    `json:"appointment_date"` // YYYY-MM-DD
	StartTime       string    `json:"start_time"`       // HH:MM:SS
	EndTime         *string   `json:"end_time,omitempty"`
	Status          string    `json:"status"`
	AppointmentType string    `json:"appointment_type"` // SCHEDULED, WALK_IN
	Notes           *string   `json:"notes,omitempty"`
	CreatedBy       *string   `json:"created_by,omitempty"`
	UpdatedBy       *string   `json:"updated_by,omitempty"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type BookAppointmentRequest struct {
	PatientID       string  `json:"patient_id" binding:"required"`
	DoctorID        *string `json:"doctor_id"`
	Department      string  `json:"department" binding:"required"`
	AppointmentDate string  `json:"appointment_date" binding:"required"`
	StartTime       string  `json:"start_time" binding:"required"`
	AppointmentType string  `json:"appointment_type"` // Default SCHEDULED if empty
	Notes           *string `json:"notes"`
}

type UpdateAppointmentRequest struct {
	AppointmentDate string  `json:"appointment_date,omitempty"`
	StartTime       string  `json:"start_time,omitempty"`
	Status          string  `json:"status,omitempty"`
	Notes           *string `json:"notes,omitempty"`
}

type CreateAvailabilityRequest struct {
	DoctorID  string `json:"doctor_id" binding:"required"`
	DayOfWeek int    `json:"day_of_week" binding:"gte=0,lte=6"`
	StartTime string `json:"start_time" binding:"required"`
	EndTime   string `json:"end_time" binding:"required"`
}
