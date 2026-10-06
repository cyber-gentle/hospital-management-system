INSERT INTO users (username, email, password_hash, first_name, last_name, phone_number, role, department, is_active)
VALUES (
    'admin',
    'admin@hospital.gov.ng',
    crypt('admin', gen_salt('bf', 12)),
    'System',
    'Administrator',
    '0000000000',
    'ADMIN',
    'IT',
    TRUE
) ON CONFLICT (username) DO NOTHING;
