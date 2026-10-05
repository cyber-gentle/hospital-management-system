package medicalrecords

import (
	"time"
)

// Patient represents a registered patient in the HIMS.
type Patient struct {
	ID                           string     `json:"id"`
	HospitalNumber               string     `json:"hospital_number"`
	FirstName                    string     `json:"first_name"`
	LastName                     string     `json:"last_name"`
	OtherNames                   *string    `json:"other_names,omitempty"`
	DateOfBirth                  string     `json:"date_of_birth"` // YYYY-MM-DD for frontend compatibility
	Gender                       string     `json:"gender"`
	PhoneNumber                  *string    `json:"phone_number,omitempty"`
	Email                        *string    `json:"email,omitempty"`
	Address                      string     `json:"address"`
	BloodGroup                   *string    `json:"blood_group,omitempty"`
	Genotype                     *string    `json:"genotype,omitempty"`
	MaritalStatus                *string    `json:"marital_status,omitempty"`
	EmergencyContactName         string     `json:"emergency_contact_name"`
	EmergencyContactPhone        string     `json:"emergency_contact_phone"`
	EmergencyContactRelationship string     `json:"emergency_contact_relationship"`
	NHIANumber                   *string    `json:"nhia_number,omitempty"`
	NHIAScheme                   *string    `json:"nhia_scheme,omitempty"`
	PaymentCategory              string     `json:"payment_category"`
	RegistrationFeePaid          bool       `json:"registration_fee_paid"`
	RegistrationFeeReceiptNo     *string    `json:"registration_fee_receipt_no,omitempty"`
	IsActive                     bool       `json:"is_active"`
	CreatedAt                    time.Time  `json:"created_at"`
	UpdatedAt                    time.Time  `json:"updated_at"`
}

// CreatePatientRequest is the payload for registering a new patient.
type CreatePatientRequest struct {
	FirstName                    string  `json:"first_name" binding:"required"`
	LastName                     string  `json:"last_name" binding:"required"`
	OtherNames                   *string `json:"other_names"`
	DateOfBirth                  string  `json:"date_of_birth" binding:"required"`
	Gender                       string  `json:"gender" binding:"required"`
	PhoneNumber                  *string `json:"phone_number"`
	Email                        *string `json:"email"`
	Address                      string  `json:"address" binding:"required"`
	BloodGroup                   *string `json:"blood_group"`
	Genotype                     *string `json:"genotype"`
	MaritalStatus                *string `json:"marital_status"`
	EmergencyContactName         string  `json:"emergency_contact_name" binding:"required"`
	EmergencyContactPhone        string  `json:"emergency_contact_phone" binding:"required"`
	EmergencyContactRelationship string  `json:"emergency_contact_relationship" binding:"required"`
	PaymentCategory              string  `json:"payment_category" binding:"required"`
	NHIANumber                   *string `json:"nhia_number"`
	NHIAScheme                   *string `json:"nhia_scheme"`
	RegistrationFeePaid          bool    `json:"registration_fee_paid"`
	RegistrationFeeReceiptNo     *string `json:"registration_fee_receipt_no"`
}
