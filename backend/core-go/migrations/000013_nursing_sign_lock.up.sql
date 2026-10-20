ALTER TABLE nursing_notes ADD COLUMN is_signed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE nursing_notes ADD COLUMN signed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE nursing_notes ADD COLUMN signed_by UUID REFERENCES users(id);
