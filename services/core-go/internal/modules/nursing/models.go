package nursing

import (
	"time"
)

type Admission struct {
	ID                 string     `json:"id"`
	PatientID          string     `json:"patientId"`
	WardID             string     `json:"wardId"`
	BedID              string     `json:"bedId"`
	AdmittedBy         string     `json:"admittedBy"`
	AdmittedAt         time.Time  `json:"admittedAt"`
	ReasonForAdmission *string    `json:"reasonForAdmission,omitempty"`
	Status             string     `json:"status"`
	DischargedAt       *time.Time `json:"dischargedAt,omitempty"`
	DischargedBy       *string    `json:"dischargedBy,omitempty"`
	DischargeSummary   *string    `json:"dischargeSummary,omitempty"`
	CreatedAt          time.Time  `json:"createdAt"`
	UpdatedAt          time.Time  `json:"updatedAt"`
}

type CreateAdmissionRequest struct {
	PatientID          string  `json:"patientId" binding:"required"`
	WardID             string  `json:"wardId" binding:"required"`
	BedID              string  `json:"bedId" binding:"required"`
	ReasonForAdmission *string `json:"reasonForAdmission"`
}

type Vitals struct {
	ID              string    `json:"id"`
	PatientID       string    `json:"patientId"`
	AdmissionID     *string   `json:"admissionId,omitempty"`
	RecordedBy      string    `json:"recordedBy"`
	Temperature     *float64  `json:"temperature,omitempty"`
	BloodPressure   *string   `json:"bloodPressure,omitempty"`
	PulseRate       *int      `json:"pulseRate,omitempty"`
	RespiratoryRate *int      `json:"respiratoryRate,omitempty"`
	SpO2            *int      `json:"spO2,omitempty"`
	Weight          *float64  `json:"weight,omitempty"`
	Height          *float64  `json:"height,omitempty"`
	Notes           *string   `json:"notes,omitempty"`
	RecordedAt      time.Time `json:"recordedAt"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type CreateVitalsRequest struct {
	PatientID       string   `json:"patientId" binding:"required"`
	AdmissionID     *string  `json:"admissionId"`
	Temperature     *float64 `json:"temperature"`
	BloodPressure   *string  `json:"bloodPressure"`
	PulseRate       *int     `json:"pulseRate"`
	RespiratoryRate *int     `json:"respiratoryRate"`
	SpO2            *int     `json:"spO2"`
	Weight          *float64 `json:"weight"`
	Height          *float64 `json:"height"`
	Notes           *string  `json:"notes"`
}

type NursingNote struct {
	ID          string    `json:"id"`
	PatientID   string    `json:"patientId"`
	AdmissionID string    `json:"admissionId"`
	RecordedBy  string    `json:"recordedBy"`
	NoteType    string    `json:"noteType"`
	Notes       string    `json:"notes"`
	RecordedAt  time.Time `json:"recordedAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CreateNursingNoteRequest struct {
	PatientID   string `json:"patientId" binding:"required"`
	AdmissionID string `json:"admissionId" binding:"required"`
	NoteType    string `json:"noteType" binding:"required"`
	Notes       string `json:"notes" binding:"required"`
}

type MyPatientResponse struct {
	PatientID       string    `json:"patientId"`
	AdmissionID     string    `json:"id"` // Maps to id in frontend
	PatientName     string    `json:"patientName"`
	HospitalNumber  string    `json:"hospitalNumber"`
	Age             int       `json:"age"`
	Gender          string    `json:"gender"`
	WardID          string    `json:"wardId"`
	WardName        string    `json:"wardName"`
	BedID           string    `json:"bedId"`
	BedNumber       string    `json:"bedNumber"`
	TriageAcuity    string    `json:"triageAcuity"`
	AdmittedAt      time.Time `json:"admissionDate"`
	DepositStatus   string    `json:"depositStatus"`
	Status          string    `json:"status"`
	BloodGroup      string    `json:"bloodGroup"`
	TariffType      string    `json:"tariffType"`
	InsuranceNumber string    `json:"insuranceNumber,omitempty"`
}

type NursingTask struct {
	ID          string     `json:"id"`
	PatientID   string     `json:"patientId"`
	AdmissionID string     `json:"admissionId"`
	AssignedTo  *string    `json:"assignedTo,omitempty"`
	TaskType    string     `json:"taskType"`
	Description string     `json:"description"`
	DueAt       time.Time  `json:"dueAt"`
	Status      string     `json:"status"`
	CompletedAt *time.Time `json:"completedAt,omitempty"`
	CompletedBy *string    `json:"completedBy,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}

type CreateNursingTaskRequest struct {
	PatientID   string  `json:"patientId" binding:"required"`
	AdmissionID string  `json:"admissionId" binding:"required"`
	AssignedTo  *string `json:"assignedTo"`
	TaskType    string  `json:"taskType" binding:"required"`
	Description string  `json:"description" binding:"required"`
	DueAt       string  `json:"dueAt" binding:"required"`
}

type CarePlan struct {
	ID            string    `json:"id"`
	PatientID     string    `json:"patientId"`
	AdmissionID   string    `json:"admissionId"`
	CreatedBy     string    `json:"createdBy"`
	TemplateName  *string   `json:"templateName,omitempty"`
	Interventions string    `json:"interventions"`
	ProgressNotes *string   `json:"progressNotes,omitempty"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

type CreateCarePlanRequest struct {
	PatientID     string  `json:"patientId" binding:"required"`
	AdmissionID   string  `json:"admissionId" binding:"required"`
	TemplateName  *string `json:"templateName"`
	Interventions string  `json:"interventions" binding:"required"`
	ProgressNotes *string `json:"progressNotes"`
}

type ShiftHandover struct {
	ID               string     `json:"id"`
	WardID           string     `json:"wardId"`
	OutgoingNurseID  string     `json:"outgoingNurseId"`
	IncomingNurseID  *string    `json:"incomingNurseId,omitempty"`
	ShiftDate        string     `json:"shiftDate"`
	ShiftType        string     `json:"shiftType"`
	EndorsementNotes string     `json:"endorsementNotes"`
	Status           string     `json:"status"`
	SignedAt         *time.Time `json:"signedAt,omitempty"`
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
}

type CreateShiftHandoverRequest struct {
	WardID           string `json:"wardId" binding:"required"`
	ShiftDate        string `json:"shiftDate" binding:"required"`
	ShiftType        string `json:"shiftType" binding:"required"`
	EndorsementNotes string `json:"endorsementNotes" binding:"required"`
}

type DischargeChecklist struct {
	ID                    string     `json:"id"`
	AdmissionID           string     `json:"admissionId"`
	CompletedBy           string     `json:"completedBy"`
	MedicationsReconciled bool       `json:"medicationsReconciled"`
	FollowUpScheduled     bool       `json:"followUpScheduled"`
	PatientEducated       bool       `json:"patientEducated"`
	BillingCleared        bool       `json:"billingCleared"`
	Status                string     `json:"status"`
	CompletedAt           *time.Time `json:"completedAt,omitempty"`
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`
}

type UpdateDischargeChecklistRequest struct {
	MedicationsReconciled bool `json:"medicationsReconciled"`
	FollowUpScheduled     bool `json:"followUpScheduled"`
	PatientEducated       bool `json:"patientEducated"`
	BillingCleared        bool `json:"billingCleared"`
}
