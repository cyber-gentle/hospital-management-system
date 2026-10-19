INSERT INTO permissions(id,module,action,description) VALUES('reporting:read','reporting','read','Read persisted financial totals and current census') ON CONFLICT(id) DO NOTHING;
