-- Exemption is explicit. Names and ward_type strings never imply A&E access.
ALTER TABLE wards ADD COLUMN is_accident_emergency BOOLEAN NOT NULL DEFAULT false;
