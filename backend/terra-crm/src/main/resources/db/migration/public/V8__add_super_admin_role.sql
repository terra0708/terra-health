-- Add ROLE_SUPER_ADMIN role to roles table
INSERT INTO roles (id, name, created_at, updated_at, deleted) VALUES 
(gen_random_uuid(), 'ROLE_SUPER_ADMIN', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)
ON CONFLICT (name) DO NOTHING;
