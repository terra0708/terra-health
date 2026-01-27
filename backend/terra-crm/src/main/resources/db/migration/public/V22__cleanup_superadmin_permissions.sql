-- V22: Cleanup Super Admin permissions
-- Remove all non-Super Admin permissions from Super Admin users
-- Keep only Dashboard and Super Admin specific permissions

-- 1. Remove all permissions from Super Admin users except Super Admin specific ones
DELETE FROM user_permissions up
WHERE EXISTS (
    SELECT 1 
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'ROLE_SUPER_ADMIN'
    AND up.user_id = u.id
)
AND up.permission_id NOT IN (
    SELECT p.id 
    FROM permissions p
    WHERE p.name IN (
        -- Dashboard permissions
        'MODULE_DASHBOARD',
        'DASHBOARD_VIEW',
        -- Super Admin module permissions
        'MODULE_SUPERADMIN',
        'SUPERADMIN_TENANTS_VIEW',
        'SUPERADMIN_TENANTS_MANAGE',
        'SUPERADMIN_USER_SEARCH_VIEW',
        'SUPERADMIN_SCHEMAPOOL_VIEW',
        'SUPERADMIN_SCHEMAPOOL_MANAGE',
        'SUPERADMIN_AUDIT_VIEW'
    )
);

-- 2. Ensure Super Admin users have all required Super Admin permissions
-- This will add any missing Super Admin permissions
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT DISTINCT 
    u.id,
    p.id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
CROSS JOIN permissions p
WHERE r.name = 'ROLE_SUPER_ADMIN'
AND p.name IN (
    'MODULE_DASHBOARD',
    'DASHBOARD_VIEW',
    'MODULE_SUPERADMIN',
    'SUPERADMIN_TENANTS_VIEW',
    'SUPERADMIN_TENANTS_MANAGE',
    'SUPERADMIN_USER_SEARCH_VIEW',
    'SUPERADMIN_SCHEMAPOOL_VIEW',
    'SUPERADMIN_SCHEMAPOOL_MANAGE',
    'SUPERADMIN_AUDIT_VIEW'
)
AND NOT EXISTS (
    SELECT 1 
    FROM user_permissions up 
    WHERE up.user_id = u.id 
    AND up.permission_id = p.id
)
ON CONFLICT (user_id, permission_id) DO NOTHING;
