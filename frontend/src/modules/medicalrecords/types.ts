export type Gender = "MALE" | "FEMALE" | "OTHER";
export type PaymentCategory = "CASH" | "NHIA" | "RETAINERSHIP";

export type NHIAScheme =
  | "NHIA_FORMAL"
  | "NHIA_INFORMAL"
  | "NHIA_VULNERABLE"
  | "STATE_SCHEME"
  | "PRIVATE_HMO";

export interface Patient {
  id: string;
  hospital_number: string;
  first_name: string;
  last_name: string;
  other_names?: string;
  date_of_birth: string; // YYYY-MM-DD
  gender: Gender;
  phone_number?: string;
  email?: string;
  address: string;
  blood_group?: string; // A+, B+, O+, AB+, etc.
  genotype?: string; // AA, AS, SS, etc.
  marital_status?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  nhia_number?: string;
  nhia_scheme?: NHIAScheme;
  payment_category: PaymentCategory;
  registration_fee_paid: boolean;
  registration_fee_receipt_no?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePatientFormInput {
  first_name: string;
  last_name: string;
  other_names?: string;
  date_of_birth: string;
  gender: Gender;
  phone_number?: string;
  email?: string;
  address: string;
  blood_group?: string;
  genotype?: string;
  marital_status?: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  payment_category: PaymentCategory;
  nhia_number?: string;
  nhia_scheme?: NHIAScheme;
  registration_fee_paid: boolean;
  registration_fee_receipt_no?: string;
}

export interface PatientIDCardData {
  patient_id: string;
  hospital_number: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  genotype: string;
  emergency_phone: string;
  payment_category: string;
  nhia_number?: string;
  barcode_payload: string;
  qrcode_payload: string;
  issued_at: string;
  issued_by: string;
}

export interface PaymentStatusData {
  patient_id: string;
  hospital_number: string;
  full_name: string;
  payment_category: PaymentCategory;
  nhia_number?: string;
  nhia_scheme?: string;
  registration_fee_paid: boolean;
  receipt_no?: string;
  eligible_for_service: boolean;
  status_reason: string;
}
