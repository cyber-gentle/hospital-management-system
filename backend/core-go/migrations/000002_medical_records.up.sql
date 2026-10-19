-- 000002_medical_records.up.sql
-- Module: Medical Records (Build Group 1)
-- Table: patients

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_number VARCHAR(50) NOT NULL UNIQUE,
    nhia_number VARCHAR(50) UNIQUE,
    
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    other_names VARCHAR(100),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10),
    genotype VARCHAR(10),
    marital_status VARCHAR(50),
    
    phone_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT NOT NULL,
    
    emergency_contact_name VARCHAR(150) NOT NULL,
    emergency_contact_phone VARCHAR(50) NOT NULL,
    emergency_contact_relationship VARCHAR(50) NOT NULL,
    
    payment_category VARCHAR(50) NOT NULL, -- CASH, NHIA, RETAINERSHIP
    nhia_scheme VARCHAR(50),
    registration_fee_paid BOOLEAN NOT NULL DEFAULT FALSE,
    registration_fee_receipt_no VARCHAR(100),
    
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_patients_hospital_number ON patients(hospital_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_nhia_number ON patients(nhia_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_patients_name ON patients(last_name, first_name) WHERE deleted_at IS NULL;
