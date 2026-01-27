-- Granular Permission Expansion Migration
-- Standard: MODULE_NAME_ACTION

-- 1. Create/Ensure MODULE_HEALTH exists
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
VALUES (gen_random_uuid(), 'MODULE_HEALTH', 'Health module access (Patients, Appointments)', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- 2. Add Granular Actions for SETTINGS
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'SETTINGS_' || action, 
    'Settings ' || action || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_SETTINGS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('USERS_VIEW'), 
    ('USERS_CREATE'), 
    ('USERS_UPDATE'), 
    ('USERS_DELETE'),
    ('ROLES_VIEW'),
    ('ROLES_MANAGE'),
    ('SYSTEM_UPDATE'),
    ('CUSTOMER_PANEL_MANAGE')
) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- 3. Add Granular Actions for HEALTH
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'HEALTH_' || action, 
    'Health ' || action || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_HEALTH'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('PATIENTS_VIEW'), 
    ('PATIENTS_EDIT'), 
    ('APPOINTMENTS_VIEW'), 
    ('APPOINTMENTS_EDIT')
) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- 4. Add Granular Actions for MARKETING
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'MARKETING_' || action, 
    'Marketing ' || action || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_MARKETING'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('DASHBOARD_VIEW'), 
    ('CAMPAIGNS_VIEW'), 
    ('ATTRIBUTION_VIEW')
) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- 5. LOCK-OUT PREVENTION: Auto-assign all new permissions to users with ROLE_ADMIN
-- We identify new permissions created in this migration (standardizing by names created above)
-- and link them to users who have ROLE_ADMIN in the user_roles table.
INSERT INTO user_permissions (user_id, permission_id, created_at, updated_at)
SELECT DISTINCT ur.user_id, p.id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
CROSS JOIN permissions p
WHERE r.name = 'ROLE_ADMIN'
AND p.name IN (
    'SETTINGS_USERS_VIEW', 'SETTINGS_USERS_CREATE', 'SETTINGS_USERS_UPDATE', 'SETTINGS_USERS_DELETE',
    'SETTINGS_ROLES_VIEW', 'SETTINGS_ROLES_MANAGE', 'SETTINGS_SYSTEM_UPDATE', 'SETTINGS_CUSTOMER_PANEL_MANAGE',
    'HEALTH_PATIENTS_VIEW', 'HEALTH_PATIENTS_EDIT', 'HEALTH_APPOINTMENTS_VIEW', 'HEALTH_APPOINTMENTS_EDIT',
    'MARKETING_DASHBOARD_VIEW', 'MARKETING_CAMPAIGNS_VIEW', 'MARKETING_ATTRIBUTION_VIEW',
    'MODULE_DASHBOARD'
)
ON CONFLICT (user_id, permission_id) DO NOTHING;
