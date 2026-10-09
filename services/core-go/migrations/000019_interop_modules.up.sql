-- Shared schema for the three Python-owned modules. Go owns migration history.
CREATE TABLE lab_test_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_code VARCHAR(50) NOT NULL UNIQUE,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE lab_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    consultation_id UUID,
    requested_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_request_id UUID NOT NULL REFERENCES lab_requests(id),
    test_catalog_id UUID NOT NULL REFERENCES lab_test_catalog(id),
    result_value TEXT,
    reference_range VARCHAR(255),
    performed_by UUID REFERENCES users(id),
    result_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE hmo_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE hmo_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hmo_provider_id UUID NOT NULL REFERENCES hmo_providers(id),
    invoice_id UUID NOT NULL REFERENCES invoices(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    claim_reference VARCHAR(100) UNIQUE,
    claim_amount NUMERIC(12,2) NOT NULL CHECK (claim_amount > 0),
    approved_amount NUMERIC(12,2) CHECK (approved_amount >= 0 AND approved_amount <= claim_amount),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    submission_date TIMESTAMPTZ,
    response_date TIMESTAMPTZ,
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TYPE radiology_request_status_enum AS ENUM ('PENDING','SCHEDULED','IN_PROGRESS','COMPLETED','CANCELLED');
CREATE TABLE radiology_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modality TEXT NOT NULL,
    exam_name TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE TABLE radiology_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    catalog_id UUID NOT NULL REFERENCES radiology_catalog(id),
    status radiology_request_status_enum NOT NULL DEFAULT 'PENDING',
    report_text TEXT,
    dicom_study_uid TEXT,
    requested_by UUID NOT NULL REFERENCES users(id),
    radiologist_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ
);
CREATE INDEX lab_requests_patient_active ON lab_requests(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX lab_results_request_active ON lab_results(lab_request_id) WHERE deleted_at IS NULL;
CREATE INDEX hmo_claims_patient_active ON hmo_claims(patient_id) WHERE deleted_at IS NULL;
CREATE INDEX radiology_requests_patient_active ON radiology_requests(patient_id) WHERE deleted_at IS NULL;
