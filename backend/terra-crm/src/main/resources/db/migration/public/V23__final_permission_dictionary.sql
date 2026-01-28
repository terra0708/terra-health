-- V23: Final Permission Dictionary - Tabula Rasa Approach
-- This migration completely resets the permissions table and rebuilds it with standardized naming
-- CRITICAL: This is a clean slate approach - all existing data will be lost

-- ============================================================================
-- STEP 1: CLEANUP (Tabula Rasa)
-- ============================================================================

-- Delete all junction table records (CASCADE will handle foreign key constraints)
DELETE FROM bundle_permissions;
DELETE FROM user_permissions;
DELETE FROM tenant_modules;
DELETE FROM user_bundles;

-- Delete all permissions (this will cascade to junction tables)
TRUNCATE TABLE permissions CASCADE;

-- ============================================================================
-- STEP 2: CREATE MODULE-LEVEL PERMISSIONS
-- ============================================================================

INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at) VALUES
-- Core Modules
(gen_random_uuid(), 'MODULE_DASHBOARD', 'Dashboard module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_APPOINTMENTS', 'Appointments module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_CUSTOMERS', 'Customers module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_REMINDERS', 'Reminders module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_STATISTICS', 'Statistics module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_NOTIFICATIONS', 'Notifications module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_MARKETING', 'Marketing/Ads module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_SETTINGS', 'Settings module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_SUPERADMIN', 'Super Admin module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- STEP 3: CREATE ACTION-LEVEL PERMISSIONS (Suffix-less naming)
-- ============================================================================

-- Dashboard Actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'DASHBOARD_VIEW',
    'Dashboard view permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_DASHBOARD'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Appointments Actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'APPOINTMENTS_VIEW',
    'Appointments view permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Customers Actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'CUSTOMERS_VIEW',
    'Customers view permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_CUSTOMERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Reminders Actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'REMINDERS_VIEW',
    'Reminders view permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_REMINDERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Statistics Actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'STATISTICS_VIEW',
    'Statistics view permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_STATISTICS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Notifications Actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'NOTIFICATIONS_VIEW',
    'Notifications view permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_NOTIFICATIONS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP;

-- Marketing Actions (Suffix-less: MARKETING_DASHBOARD, not MARKETING_DASHBOARD_VIEW)
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    permission_name,
    description_text,
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_MARKETING'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('MARKETING_DASHBOARD', 'Marketing dashboard permission'),
    ('MARKETING_CAMPAIGNS', 'Marketing campaigns permission'),
    ('MARKETING_ATTRIBUTION', 'Marketing attribution permission')
) AS marketing_permissions(permission_name, description_text);

-- Settings Actions (Suffix-less: SETTINGS_USERS, not SETTINGS_USERS_VIEW)
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    permission_name,
    description_text,
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_SETTINGS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('SETTINGS_USERS', 'Settings users permission'),
    ('SETTINGS_PERMISSIONS', 'Settings permissions permission'),
    ('SETTINGS_REMINDERS', 'Settings reminders permission'),
    ('SETTINGS_SYSTEM', 'Settings system permission'),
    ('SETTINGS_CUSTOMER_PANEL', 'Settings customer panel permission')
) AS settings_permissions(permission_name, description_text);

-- Super Admin Actions
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
) AS superadmin_permissions(permission_name, description_text);

-- ============================================================================
-- STEP 4: VALIDATION - Verify Parent-Child Relationships
-- ============================================================================

-- CRITICAL: Verify that all ACTION permissions have a valid parent MODULE permission
-- This query should return 0 rows if everything is correct
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM permissions p
    WHERE p.type = 'ACTION'
    AND (p.parent_permission_id IS NULL 
         OR NOT EXISTS (
             SELECT 1 FROM permissions parent 
             WHERE parent.id = p.parent_permission_id 
             AND parent.type = 'MODULE'
         ));
    
    IF orphaned_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Found % orphaned ACTION permissions without valid MODULE parent', orphaned_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All ACTION permissions have valid MODULE parents';
END $$;

-- Display parent-child relationships for verification
-- This query shows all ACTION permissions with their parent MODULE
-- Expected output: All ACTION permissions should have a parent MODULE
SELECT 
    p.name AS action_permission,
    parent.name AS parent_module,
    p.type AS permission_type
FROM permissions p
LEFT JOIN permissions parent ON p.parent_permission_id = parent.id
WHERE p.type = 'ACTION'
ORDER BY parent.name, p.name;
