-- V20: Add Super Admin granular permissions
-- This migration adds MODULE_SUPERADMIN and granular Super Admin permissions

-- 1. Create MODULE_SUPERADMIN permission
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
VALUES (gen_random_uuid(), 'MODULE_SUPERADMIN', 'Super Admin module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 2. Create granular Super Admin ACTION permissions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    permission_name,
    description_text,
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_SUPERADMIN'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('SUPERADMIN_TENANTS_VIEW', 'View tenants'),
    ('SUPERADMIN_TENANTS_MANAGE', 'Manage tenants (create, update, delete)'),
    ('SUPERADMIN_USER_SEARCH_VIEW', 'Search and view users across tenants'),
    ('SUPERADMIN_SCHEMAPOOL_VIEW', 'View schema pool'),
    ('SUPERADMIN_SCHEMAPOOL_MANAGE', 'Manage schema pool'),
    ('SUPERADMIN_AUDIT_VIEW', 'View audit logs')
) AS permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- 3. Auto-assign all Super Admin permissions to users with ROLE_SUPER_ADMIN
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT DISTINCT ur.user_id, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
CROSS JOIN permissions p
WHERE r.name = 'ROLE_SUPER_ADMIN'
AND p.name IN (
    'MODULE_SUPERADMIN',
    'SUPERADMIN_TENANTS_VIEW',
    'SUPERADMIN_TENANTS_MANAGE',
    'SUPERADMIN_USER_SEARCH_VIEW',
    'SUPERADMIN_SCHEMAPOOL_VIEW',
    'SUPERADMIN_SCHEMAPOOL_MANAGE',
    'SUPERADMIN_AUDIT_VIEW'
)
ON CONFLICT (user_id, permission_id) DO NOTHING;
