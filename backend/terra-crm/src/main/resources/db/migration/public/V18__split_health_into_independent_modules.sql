-- V18: Split MODULE_HEALTH into independent modules
-- This migration removes the MODULE_HEALTH grouping and makes each module independent

-- 1. Create independent MODULE_APPOINTMENTS (if not exists)
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
VALUES (gen_random_uuid(), 'MODULE_APPOINTMENTS', 'Appointments module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 2. Create independent MODULE_CUSTOMERS (if not exists)
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
VALUES (gen_random_uuid(), 'MODULE_CUSTOMERS', 'Customers module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 3. Re-parent APPOINTMENTS_* actions to MODULE_APPOINTMENTS
UPDATE permissions
SET parent_permission_id = (SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS')
WHERE name IN ('APPOINTMENTS_VIEW', 'APPOINTMENTS_CREATE', 'APPOINTMENTS_UPDATE', 'APPOINTMENTS_DELETE')
AND parent_permission_id IS NULL OR parent_permission_id != (SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS');

-- 4. Re-parent CUSTOMERS_* actions to MODULE_CUSTOMERS
UPDATE permissions
SET parent_permission_id = (SELECT id FROM permissions WHERE name = 'MODULE_CUSTOMERS')
WHERE name IN ('CUSTOMERS_VIEW', 'CUSTOMERS_CREATE', 'CUSTOMERS_UPDATE', 'CUSTOMERS_DELETE')
AND parent_permission_id IS NULL OR parent_permission_id != (SELECT id FROM permissions WHERE name = 'MODULE_CUSTOMERS');

-- 5. Create ACTION permissions for APPOINTMENTS if they don't exist
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    action, 
    'Appointments ' || SUBSTRING(action FROM 14) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('APPOINTMENTS_VIEW'), 
    ('APPOINTMENTS_CREATE'), 
    ('APPOINTMENTS_UPDATE'), 
    ('APPOINTMENTS_DELETE')
) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- 6. Create ACTION permissions for CUSTOMERS if they don't exist
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    action, 
    'Customers ' || SUBSTRING(action FROM 11) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_CUSTOMERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('CUSTOMERS_VIEW'), 
    ('CUSTOMERS_CREATE'), 
    ('CUSTOMERS_UPDATE'), 
    ('CUSTOMERS_DELETE')
) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- 7. Auto-assign new module permissions to ROLE_ADMIN users
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT DISTINCT ur.user_id, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
CROSS JOIN permissions p
WHERE r.name = 'ROLE_ADMIN'
AND p.name IN (
    'MODULE_APPOINTMENTS', 'MODULE_CUSTOMERS',
    'APPOINTMENTS_VIEW', 'APPOINTMENTS_CREATE', 'APPOINTMENTS_UPDATE', 'APPOINTMENTS_DELETE',
    'CUSTOMERS_VIEW', 'CUSTOMERS_CREATE', 'CUSTOMERS_UPDATE', 'CUSTOMERS_DELETE'
)
ON CONFLICT (user_id, permission_id) DO NOTHING;

-- 8. DEPRECATE MODULE_HEALTH (keep for backward compatibility but mark as deprecated)
UPDATE permissions
SET description = '[DEPRECATED] Health module access - Use MODULE_APPOINTMENTS and MODULE_CUSTOMERS instead'
WHERE name = 'MODULE_HEALTH';

-- 9. Remove MODULE_HEALTH from being a parent (orphan old HEALTH_* permissions)
UPDATE permissions
SET parent_permission_id = NULL
WHERE parent_permission_id = (SELECT id FROM permissions WHERE name = 'MODULE_HEALTH');
