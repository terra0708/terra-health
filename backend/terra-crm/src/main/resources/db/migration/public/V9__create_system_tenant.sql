-- Create SYSTEM tenant for Super Admin users
-- This tenant uses 'public' schema (Super Admin operations are in public schema)
INSERT INTO tenants (id, name, schema_name, created_at, updated_at, deleted) VALUES 
(gen_random_uuid(), 'SYSTEM', 'public', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, false)
ON CONFLICT (schema_name) DO NOTHING;
