-- Row triggers do not fire for TRUNCATE. Protect the append-only table at the
-- statement boundary as well; the existing writer remains unchanged.
CREATE TRIGGER trg_audit_logs_prevent_truncate
BEFORE TRUNCATE ON audit_logs
FOR EACH STATEMENT EXECUTE FUNCTION prevent_audit_log_modification();
