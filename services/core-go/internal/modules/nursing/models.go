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
	ID              string    `json:"id"`
	PatientID       string    `json:"patient_id"`
	AdmissionID     *string   `json:"admission_id,omitempty"`
	RecordedBy      string    `json:"recorded_by"`
	Temperature     *float64  `json:"temperature,omitempty"`
	BloodPressure   *string   `json:"blood_pressure,omitempty"`
	PulseRate       *int      `json:"pulse_rate,omitempty"`
	RespiratoryRate *int      `json:"respiratory_rate,omitempty"`
	SpO2            *int      `json:"sp_o2,omitempty"`
	Weight          *float64  `json:"weight,omitempty"`
	Height          *float64  `json:"height,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	RecordedAt      time.Time `json:"recorded_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
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

type MyPatientResponse struct {
	PatientID      string    `json:"patient_id"`
	AdmissionID    string    `json:"admission_id"`
	HospitalNumber string    `json:"hospital_number"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	WardName       string    `json:"ward_name"`
	BedNumber      string    `json:"bed_number"`
	RiskLevel      string    `json:"risk_level"` // Critical, High Risk, Stable
	AdmittedAt     time.Time `json:"admitted_at"`
}

type NursingTask struct {
	ID          string     `json:"id"`
	PatientID   string     `json:"patient_id"`
	AdmissionID string     `json:"admission_id"`
	AssignedTo  *string    `json:"assigned_to,omitempty"`
	TaskType    string     `json:"task_type"`
	Description string     `json:"description"`
	DueAt       time.Time  `json:"due_at"`
	Status      string     `json:"status"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CompletedBy *string    `json:"completed_by,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type CreateNursingTaskRequest struct {
	PatientID   string  `json:"patient_id" binding:"required"`
	AdmissionID string  `json:"admission_id" binding:"required"`
	AssignedTo  *string `json:"assigned_to"`
	TaskType    string  `json:"task_type" binding:"required"`
	Description string  `json:"description" binding:"required"`
	DueAt       string  `json:"due_at" binding:"required"`
}

type CarePlan struct {
	ID            string    `json:"id"`
	PatientID     string    `json:"patient_id"`
	AdmissionID   string    `json:"admission_id"`
	CreatedBy     string    `json:"created_by"`
	TemplateName  *string   `json:"template_name,omitempty"`
	Interventions string    `json:"interventions"`
	ProgressNotes *string   `json:"progress_notes,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type CreateCarePlanRequest struct {
	PatientID     string  `json:"patient_id" binding:"required"`
	AdmissionID   string  `json:"admission_id" binding:"required"`
	TemplateName  *string `json:"template_name"`
	Interventions string  `json:"interventions" binding:"required"`
	ProgressNotes *string `json:"progress_notes"`
}

type ShiftHandover struct {
	ID               string     `json:"id"`
	WardID           string     `json:"ward_id"`
	OutgoingNurseID  string     `json:"outgoing_nurse_id"`
	IncomingNurseID  *string    `json:"incoming_nurse_id,omitempty"`
	ShiftDate        string     `json:"shift_date"`
	ShiftType        string     `json:"shift_type"`
	EndorsementNotes string     `json:"endorsement_notes"`
	Status           string     `json:"status"`
	SignedAt         *time.Time `json:"signed_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type CreateShiftHandoverRequest struct {
	WardID           string `json:"ward_id" binding:"required"`
	ShiftDate        string `json:"shift_date" binding:"required"`
	ShiftType        string `json:"shift_type" binding:"required"`
	EndorsementNotes string `json:"endorsement_notes" binding:"required"`
}

type DischargeChecklist struct {
	ID                    string     `json:"id"`
	AdmissionID           string     `json:"admission_id"`
	CompletedBy           string     `json:"completed_by"`
	MedicationsReconciled bool       `json:"medications_reconciled"`
	FollowUpScheduled     bool       `json:"follow_up_scheduled"`
	PatientEducated       bool       `json:"patient_educated"`
	BillingCleared        bool       `json:"billing_cleared"`
	Status                string     `json:"status"`
	CompletedAt           *time.Time `json:"completed_at,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

type UpdateDischargeChecklistRequest struct {
	MedicationsReconciled bool `json:"medications_reconciled"`
	FollowUpScheduled     bool `json:"follow_up_scheduled"`
	PatientEducated       bool `json:"patient_educated"`
	BillingCleared        bool `json:"billing_cleared"`
}
