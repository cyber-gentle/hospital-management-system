-- 000001_init_schema.down.sql

DROP TRIGGER IF EXISTS trg_audit_logs_prevent_delete ON audit_logs;
DROP TRIGGER IF EXISTS trg_audit_logs_prevent_update ON audit_logs;
DROP FUNCTION IF EXISTS prevent_audit_log_modification();
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS users;
