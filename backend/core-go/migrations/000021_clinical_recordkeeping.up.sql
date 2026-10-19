-- Initial unverified recordkeeping only. No clinical workflow transitions.
CREATE TABLE clinical_module_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 module TEXT NOT NULL CHECK(module IN ('theatre','emergency','maternity')),
 patient_id UUID NOT NULL REFERENCES patients(id),
 kind TEXT NOT NULL,
 summary VARCHAR(200) NOT NULL CHECK(length(trim(summary)) > 0),
 notes TEXT NOT NULL CHECK(length(trim(notes)) > 0 AND length(notes) <= 20000),
 occurred_at TIMESTAMPTZ NOT NULL,
 documentation_status TEXT NOT NULL DEFAULT 'RECORDED_UNVERIFIED' CHECK(documentation_status='RECORDED_UNVERIFIED'),
 created_by UUID NOT NULL REFERENCES users(id),
 updated_by UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
 deleted_at TIMESTAMPTZ,
 CHECK ((module='theatre' AND kind IN ('SURGERY_BOOKING','PRE_OP_OBSERVATION','OPERATIVE_NOTE','RECOVERY_NOTE'))
 OR (module='emergency' AND kind IN ('TRIAGE_NOTE','STABILIZATION_NOTE','MEDICATION_RECORD'))
 OR (module='maternity' AND kind IN ('ANTENATAL_NOTE','DELIVERY_NOTE','POSTNATAL_NOTE')))
);
CREATE INDEX clinical_module_records_patient ON clinical_module_records(module,patient_id,occurred_at DESC,id) WHERE deleted_at IS NULL;
INSERT INTO permissions(id,module,action,description)
SELECT module||':'||action,module,action,'Clinical recordkeeping; no sign-off or automatic transfers'
FROM unnest(ARRAY['theatre','emergency','maternity']) AS module
CROSS JOIN unnest(ARRAY['read','write']) AS action
ON CONFLICT(id) DO NOTHING;
