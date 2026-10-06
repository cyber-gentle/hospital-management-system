package nursing


type AdmissionChecklist struct {
	ConsentSigned          bool `json:"consentSigned"`
	IDWristbandApplied     bool `json:"idWristbandApplied"`
	AllergyBandApplied     bool `json:"allergyBandApplied"`
	OrientationCompleted   bool `json:"orientationCompleted"`
	BelongingsDocumented   bool `json:"belongingsDocumented"`
	InitialVitalsDone      bool `json:"initialVitalsDone"`
	ValuablesStorageSigned bool `json:"valuablesStorageSigned"`
}

type Admission struct {
	ID                  string             `json:"id"`
	PatientID           string             `json:"patientId"`
	PatientName         string             `json:"patientName"`
	HospitalNumber      string             `json:"hospitalNumber"`
	Age                 int                `json:"age"`
	Gender              string             `json:"gender"`
	AdmissionDate       string             `json:"admissionDate"`
	WardID              string             `json:"wardId"`
	WardName            string             `json:"wardName"`
	BedNumber           string             `json:"bedNumber"`
	AdmittingDoctor     string             `json:"admittingDoctor"`
	PrimaryDiagnosis    string             `json:"primaryDiagnosis"`
	TriageAcuity        string             `json:"triageAcuity"`
	DepositStatus       string             `json:"depositStatus"`
	AdmissionChecklist  AdmissionChecklist `json:"admissionChecklist"`
	Status              string             `json:"status"`
	Allergies           []string           `json:"allergies"`
	ResuscitationStatus string             `json:"resuscitationStatus"`
	BloodGroup          string             `json:"bloodGroup"`
	TariffType          string             `json:"tariffType"`
	InsuranceNumber     *string            `json:"insuranceNumber,omitempty"`
	LastVitalsRecordedAt *string           `json:"lastVitalsRecordedAt,omitempty"`
}

type CreateAdmissionRequest struct {
	PatientID          string  `json:"patientId" binding:"required"`
	WardID             string  `json:"wardId" binding:"required"`
	BedID              string  `json:"bedId" binding:"required"`
	ReasonForAdmission *string `json:"reasonForAdmission"`
}

type Bed struct {
	ID                 string  `json:"id"`
	WardID             string  `json:"wardId"`
	BedNumber          string  `json:"bedNumber"`
	Status             string  `json:"status"`
	CurrentAdmissionID *string `json:"currentAdmissionId,omitempty"`
	PatientName        *string `json:"patientName,omitempty"`
	HospitalNumber     *string `json:"hospitalNumber,omitempty"`
	Acuity             *string `json:"acuity,omitempty"`
	OccupiedSince      *string `json:"occupiedSince,omitempty"`
}

type Ward struct {
	ID            string `json:"id"`
	Name          string `json:"name"`
	Department    string `json:"department"`
	TotalBeds     int    `json:"totalBeds"`
	OccupiedBeds  int    `json:"occupiedBeds"`
	AvailableBeds int    `json:"availableBeds"`
	Beds          []Bed  `json:"beds"`
}

type Vitals struct {
	ID                    string  `json:"id"`
	AdmissionID           string  `json:"admissionId"`
	PatientName           string  `json:"patientName"`
	HospitalNumber        string  `json:"hospitalNumber"`
	RecordedAt            string  `json:"recordedAt"`
	RecordedBy            string  `json:"recordedBy"`
	BloodPressureSystolic int     `json:"bloodPressureSystolic"`
	BloodPressureDiastolic int    `json:"bloodPressureDiastolic"`
	PulseRate             int     `json:"pulseRate"`
	RespiratoryRate       int     `json:"respiratoryRate"`
	Temperature           float64 `json:"temperature"`
	OxygenSaturation      int     `json:"oxygenSaturation"`
	PainScore             int     `json:"painScore"`
	ConsciousnessLevel    string  `json:"consciousnessLevel"`
	BloodGlucose          *float64 `json:"bloodGlucose,omitempty"`
	EarlyWarningScore     int     `json:"earlyWarningScore"`
	IsAbnormal            bool    `json:"isAbnormal"`
	Source                string  `json:"source"`
	ClinicalNotes         *string `json:"clinicalNotes,omitempty"`
}

type CreateVitalsRequest struct {
	PatientID             string   `json:"patientId" binding:"required"`
	AdmissionID           *string  `json:"admissionId"`
	Temperature           *float64 `json:"temperature"`
	BloodPressureSystolic *int     `json:"bloodPressureSystolic"`
	BloodPressureDiastolic *int    `json:"bloodPressureDiastolic"`
	PulseRate             *int     `json:"pulseRate"`
	RespiratoryRate       *int     `json:"respiratoryRate"`
	OxygenSaturation      *int     `json:"oxygenSaturation"`
	ConsciousnessLevel    *string  `json:"consciousnessLevel"`
	Notes                 *string  `json:"notes"`
	Source                *string  `json:"source"`
	PainScore             *int     `json:"painScore"`
}

type NursingNote struct {
	ID          string   `json:"id"`
	AdmissionID string   `json:"admissionId"`
	PatientName string   `json:"patientName"`
	NoteType    string   `json:"noteType"`
	Tags        []string `json:"tags"`
	Content     string   `json:"content"`
	WrittenAt   string   `json:"writtenAt"`
	AuthorName  string   `json:"authorName"`
	AuthorRole  string   `json:"authorRole"`
	IsSigned    bool     `json:"isSigned"`
	SignedAt    *string  `json:"signedAt,omitempty"`
	SignedBy    *string  `json:"signedBy,omitempty"`
}

type CreateNursingNoteRequest struct {
	PatientID   string `json:"patientId" binding:"required"`
	AdmissionID string `json:"admissionId" binding:"required"`
	NoteType    string `json:"noteType" binding:"required"`
	Content     string `json:"content" binding:"required"`
}

type MedicationMARDetails struct {
	DrugName     string `json:"drugName"`
	Dosage       string `json:"dosage"`
	Route        string `json:"route"`
	Frequency    string `json:"frequency"`
	PrescribedBy string `json:"prescribedBy"`
}

type NursingTask struct {
	ID                string                `json:"id"`
	AdmissionID       string                `json:"admissionId"`
	PatientName       string                `json:"patientName"`
	BedNumber         string                `json:"bedNumber"`
	WardName          string                `json:"wardName"`
	Title             string                `json:"title"`
	Description       string                `json:"description"`
	Category          string                `json:"category"`
	ScheduledTime     string                `json:"scheduledTime"`
	Status            string                `json:"status"`
	AssignedNurse     string                `json:"assignedNurse"`
	MarLinked         bool                  `json:"marLinked"`
	MedicationDetails *MedicationMARDetails `json:"medicationDetails,omitempty"`
	CompletedAt       *string               `json:"completedAt,omitempty"`
	CompletedBy       *string               `json:"completedBy,omitempty"`
	PostponeReason    *string               `json:"postponeReason,omitempty"`
}

type CreateNursingTaskRequest struct {
	PatientID   string  `json:"patientId" binding:"required"`
	AdmissionID string  `json:"admissionId" binding:"required"`
	AssignedTo  *string `json:"assignedTo"`
	Category    string  `json:"category" binding:"required"`
	Title       string  `json:"title" binding:"required"`
	Description string  `json:"description" binding:"required"`
	DueAt       string  `json:"dueAt" binding:"required"`
}

type CarePlanIntervention struct {
	ID          string `json:"id"`
	Description string `json:"description"`
	Frequency   string `json:"frequency"`
	Status      string `json:"status"`
	Evaluation  string `json:"evaluation"`
}

type CarePlan struct {
	ID               string                 `json:"id"`
	AdmissionID      string                 `json:"admissionId"`
	PatientName      string                 `json:"patientName"`
	NursingDiagnosis string                 `json:"nursingDiagnosis"`
	ClinicalGoal     string                 `json:"clinicalGoal"`
	Status           string                 `json:"status"`
	Interventions    []CarePlanIntervention `json:"interventions"`
	CreatedAt        string                 `json:"createdAt"`
	NurseInCharge    string                 `json:"nurseInCharge"`
}

type CreateCarePlanRequest struct {
	PatientID        string                 `json:"patientId" binding:"required"`
	AdmissionID      string                 `json:"admissionId" binding:"required"`
	TemplateName     *string                `json:"templateName"`
	Interventions    []CarePlanIntervention `json:"interventions" binding:"required"`
	NursingDiagnosis *string                `json:"nursingDiagnosis"`
	ClinicalGoal     *string                `json:"clinicalGoal"`
}

type PatientEndorsement struct {
	AdmissionID     string `json:"admissionId"`
	PatientName     string `json:"patientName"`
	BedNumber       string `json:"bedNumber"`
	Acuity          string `json:"acuity"`
	ClinicalSummary string `json:"clinicalSummary"`
	PendingTasks    string `json:"pendingTasks"`
}

type ShiftHandover struct {
	ID                  string               `json:"id"`
	WardID              string               `json:"wardId"`
	WardName            string               `json:"wardName"`
	Shift               string               `json:"shift"`
	HandoverDate        string               `json:"handoverDate"`
	OutgoingNurse       string               `json:"outgoingNurse"`
	IncomingNurse       *string              `json:"incomingNurse,omitempty"`
	IsDualSigned        bool                 `json:"isDualSigned"`
	OutgoingSignedAt    string               `json:"outgoingSignedAt"`
	IncomingSignedAt    *string              `json:"incomingSignedAt,omitempty"`
	GeneralWardNotes    string               `json:"generalWardNotes"`
	PatientEndorsements []PatientEndorsement `json:"patientEndorsements"`
}

type CreateShiftHandoverRequest struct {
	WardID           string `json:"wardId" binding:"required"`
	Shift            string `json:"shift" binding:"required"`
	OutgoingNurse    string `json:"outgoingNurse" binding:"required"`
	GeneralWardNotes string `json:"generalWardNotes" binding:"required"`
}

type DischargeChecklistItem struct {
	ID          string  `json:"id"`
	Label       string  `json:"label"`
	Category    string  `json:"category"`
	Completed   bool    `json:"completed"`
	Mandatory   bool    `json:"mandatory"`
	CompletedBy *string `json:"completedBy,omitempty"`
	CompletedAt *string `json:"completedAt,omitempty"`
}

type DischargeDossier struct {
	AdmissionID                string                   `json:"admissionId"`
	PatientName                string                   `json:"patientName"`
	HospitalNumber             string                   `json:"hospitalNumber"`
	WardName                   string                   `json:"wardName"`
	BedNumber                  string                   `json:"bedNumber"`
	DoctorDischargeOrderSigned bool                     `json:"doctorDischargeOrderSigned"`
	DoctorName                 *string                  `json:"doctorName,omitempty"`
	OrderSignedAt              *string                  `json:"orderSignedAt,omitempty"`
	Items                      []DischargeChecklistItem `json:"items"`
	IsChecklist100Percent      bool                     `json:"isChecklist100Percent"`
	HasMatronOverride          bool                     `json:"hasMatronOverride"`
	MatronOverrideReason       *string                  `json:"matronOverrideReason,omitempty"`
	MatronOverrideBy           *string                  `json:"matronOverrideBy,omitempty"`
	CanTriggerBilling          bool                     `json:"canTriggerBilling"`
	BillingTriggered           bool                     `json:"billingTriggered"`
	BillingInvoiceID           *string                  `json:"billingInvoiceId,omitempty"`
	DischargedAt               *string                  `json:"dischargedAt,omitempty"`
}

type UpdateDischargeChecklistRequest struct {
	MedicationsReconciled bool `json:"medicationsReconciled"`
	FollowUpScheduled     bool `json:"followUpScheduled"`
	PatientEducated       bool `json:"patientEducated"`
	BillingCleared        bool `json:"billingCleared"`
}

type ToggleDischargeItemRequest struct {
	NurseName string `json:"nurseName" binding:"required"`
}

type MatronOverrideRequest struct {
	Reason     string `json:"reason" binding:"required"`
	MatronName string `json:"matronName" binding:"required"`
}

type UpdateTaskStatusRequest struct {
	Status string  `json:"status" binding:"required"`
	Actor  string  `json:"actor" binding:"required"`
	Reason *string `json:"reason"`
}

type SignNoteRequest struct {
	SignatoryName string `json:"signatoryName" binding:"required"`
}

type SignHandoverRequest struct {
	IncomingNurseName string `json:"incomingNurseName" binding:"required"`
}
