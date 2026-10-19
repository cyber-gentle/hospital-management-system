INSERT INTO permissions(id,module,action,description) VALUES
 ('admin:read','admin','read','Review accounts and permission grants'),
 ('admin:write','admin','write','Manage accounts; additionally requires current ADMIN role')
ON CONFLICT(id) DO NOTHING;
INSERT INTO role_permissions(role,permission_id) VALUES('AUDITOR','admin:read') ON CONFLICT DO NOTHING;
