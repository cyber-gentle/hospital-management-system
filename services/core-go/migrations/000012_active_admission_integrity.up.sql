-- Do not rewrite historical clinical records to make an index build succeed.
-- A deployment with existing conflicts needs explicit hospital reconciliation.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM admissions WHERE status='ADMITTED' AND deleted_at IS NULL GROUP BY bed_id HAVING count(*)>1)
       OR EXISTS (SELECT 1 FROM admissions WHERE status='ADMITTED' AND deleted_at IS NULL GROUP BY patient_id HAVING count(*)>1) THEN
        RAISE EXCEPTION 'Conflicting active admissions require hospital review; no clinical records were modified';
    END IF;
END;
$$;
CREATE UNIQUE INDEX idx_admissions_active_bed ON admissions(bed_id) WHERE status='ADMITTED' AND deleted_at IS NULL;
CREATE UNIQUE INDEX idx_admissions_active_patient ON admissions(patient_id) WHERE status='ADMITTED' AND deleted_at IS NULL;
