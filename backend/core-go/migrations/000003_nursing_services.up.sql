-- Wards Table
CREATE TABLE wards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    ward_type VARCHAR(50) NOT NULL, -- e.g., 'GENERAL', 'ICU', 'PEDIATRICS', 'MATERNITY'
    capacity INT NOT NULL,
    current_occupancy INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Beds Table
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES wards(id),
    bed_number VARCHAR(20) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(ward_id, bed_number)
);

-- Admissions Table
CREATE TABLE admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    ward_id UUID NOT NULL REFERENCES wards(id),
    bed_id UUID NOT NULL REFERENCES beds(id),
    admitted_by UUID NOT NULL REFERENCES users(id),
    admitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason_for_admission TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ADMITTED', -- 'ADMITTED', 'DISCHARGED', 'TRANSFERRED'
    discharged_at TIMESTAMP WITH TIME ZONE,
    discharged_by UUID REFERENCES users(id),
    discharge_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Vitals Table
CREATE TABLE vitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    admission_id UUID REFERENCES admissions(id), -- Nullable if vitals taken in outpatient triage
    recorded_by UUID NOT NULL REFERENCES users(id),
    temperature NUMERIC(4,1), -- in Celsius
    blood_pressure VARCHAR(20), -- e.g., '120/80'
    pulse_rate INT,
    respiratory_rate INT,
    spO2 INT,
    weight NUMERIC(5,2), -- in kg
    height NUMERIC(5,2), -- in cm
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Nursing Notes Table
CREATE TABLE nursing_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    admission_id UUID NOT NULL REFERENCES admissions(id),
    recorded_by UUID NOT NULL REFERENCES users(id),
    note_type VARCHAR(50) NOT NULL, -- e.g., 'GENERAL', 'MEDICATION_ADMINISTERED', 'INCIDENT'
    notes TEXT NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
