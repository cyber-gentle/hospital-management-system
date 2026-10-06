-- Nursing Tasks Table
CREATE TABLE nursing_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    admission_id UUID NOT NULL REFERENCES admissions(id),
    assigned_to UUID REFERENCES users(id),
    task_type VARCHAR(50) NOT NULL, -- e.g., 'MEDICATION', 'ASSESSMENT', 'PROCEDURE'
    description TEXT NOT NULL,
    due_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'CANCELLED'
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Care Plans Table
CREATE TABLE care_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    admission_id UUID NOT NULL REFERENCES admissions(id),
    created_by UUID NOT NULL REFERENCES users(id),
    template_name VARCHAR(100),
    interventions TEXT NOT NULL,
    progress_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'RESOLVED'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Shift Handovers Table
CREATE TABLE shift_handovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ward_id UUID NOT NULL REFERENCES wards(id),
    outgoing_nurse_id UUID NOT NULL REFERENCES users(id),
    incoming_nurse_id UUID REFERENCES users(id), -- Nullable until incoming signs
    shift_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL, -- 'MORNING', 'AFTERNOON', 'NIGHT'
    endorsement_notes TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SIGNED'
    signed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Discharge Checklists Table
CREATE TABLE discharge_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL UNIQUE REFERENCES admissions(id),
    completed_by UUID NOT NULL REFERENCES users(id),
    medications_reconciled BOOLEAN NOT NULL DEFAULT false,
    follow_up_scheduled BOOLEAN NOT NULL DEFAULT false,
    patient_educated BOOLEAN NOT NULL DEFAULT false,
    billing_cleared BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED'
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);
