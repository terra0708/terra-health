-- V25: Add CRUD permissions for all modules
-- This migration adds CREATE, UPDATE, DELETE permissions for modules that only have VIEW
-- CRITICAL: Only adds permissions that don't already exist (ON CONFLICT DO NOTHING)

-- ============================================================================
-- APPOINTMENTS Module - Add CREATE, UPDATE, DELETE
-- ============================================================================
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    permission_name,
    description_text,
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('APPOINTMENTS_CREATE', 'Create appointments permission'),
    ('APPOINTMENTS_UPDATE', 'Update appointments permission'),
    ('APPOINTMENTS_DELETE', 'Delete appointments permission')
) AS appointments_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- CUSTOMERS Module - Add CREATE, UPDATE, DELETE
-- ============================================================================
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    permission_name,
    description_text,
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_CUSTOMERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('CUSTOMERS_CREATE', 'Create customers permission'),
    ('CUSTOMERS_UPDATE', 'Update customers permission'),
    ('CUSTOMERS_DELETE', 'Delete customers permission')
) AS customers_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- REMINDERS Module - Add CREATE, UPDATE, DELETE
-- ============================================================================
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    permission_name,
    description_text,
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_REMINDERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES 
    ('REMINDERS_CREATE', 'Create reminders permission'),
    ('REMINDERS_UPDATE', 'Update reminders permission'),
    ('REMINDERS_DELETE', 'Delete reminders permission')
) AS reminders_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SETTINGS Module - Add CRUD for PERMISSIONS (Bundles)
-- ============================================================================
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
    ('SETTINGS_PERMISSIONS_VIEW', 'View permission bundles'),
    ('SETTINGS_PERMISSIONS_CREATE', 'Create permission bundles'),
    ('SETTINGS_PERMISSIONS_UPDATE', 'Update permission bundles'),
    ('SETTINGS_PERMISSIONS_DELETE', 'Delete permission bundles')
) AS settings_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SETTINGS Module - Add CRUD for REMINDERS settings
-- ============================================================================
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
    ('SETTINGS_REMINDERS_VIEW', 'View reminder settings'),
    ('SETTINGS_REMINDERS_CREATE', 'Create reminder settings'),
    ('SETTINGS_REMINDERS_UPDATE', 'Update reminder settings'),
    ('SETTINGS_REMINDERS_DELETE', 'Delete reminder settings')
) AS settings_reminders_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SETTINGS Module - Add CRUD for SYSTEM settings
-- ============================================================================
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
    ('SETTINGS_SYSTEM_VIEW', 'View system settings'),
    ('SETTINGS_SYSTEM_CREATE', 'Create system settings'),
    ('SETTINGS_SYSTEM_UPDATE', 'Update system settings'),
    ('SETTINGS_SYSTEM_DELETE', 'Delete system settings')
) AS settings_system_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SETTINGS Module - Add CRUD for CUSTOMER_PANEL settings
-- ============================================================================
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
    ('SETTINGS_CUSTOMER_PANEL_VIEW', 'View customer panel settings'),
    ('SETTINGS_CUSTOMER_PANEL_CREATE', 'Create customer panel settings'),
    ('SETTINGS_CUSTOMER_PANEL_UPDATE', 'Update customer panel settings'),
    ('SETTINGS_CUSTOMER_PANEL_DELETE', 'Delete customer panel settings')
) AS settings_customer_panel_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MARKETING Module - Add CRUD for DASHBOARD, CAMPAIGNS, ATTRIBUTION
-- ============================================================================
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
    ('MARKETING_DASHBOARD_VIEW', 'View marketing dashboard'),
    ('MARKETING_DASHBOARD_CREATE', 'Create marketing dashboard items'),
    ('MARKETING_DASHBOARD_UPDATE', 'Update marketing dashboard items'),
    ('MARKETING_DASHBOARD_DELETE', 'Delete marketing dashboard items'),
    ('MARKETING_CAMPAIGNS_VIEW', 'View marketing campaigns'),
    ('MARKETING_CAMPAIGNS_CREATE', 'Create marketing campaigns'),
    ('MARKETING_CAMPAIGNS_UPDATE', 'Update marketing campaigns'),
    ('MARKETING_CAMPAIGNS_DELETE', 'Delete marketing campaigns'),
    ('MARKETING_ATTRIBUTION_VIEW', 'View marketing attribution'),
    ('MARKETING_ATTRIBUTION_CREATE', 'Create marketing attribution'),
    ('MARKETING_ATTRIBUTION_UPDATE', 'Update marketing attribution'),
    ('MARKETING_ATTRIBUTION_DELETE', 'Delete marketing attribution')
) AS marketing_permissions(permission_name, description_text)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- VALIDATION - Verify all new permissions have valid parent MODULE
-- ============================================================================
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned_count
    FROM permissions p
    WHERE p.type = 'ACTION'
    AND p.name IN (
        'APPOINTMENTS_CREATE', 'APPOINTMENTS_UPDATE', 'APPOINTMENTS_DELETE',
        'CUSTOMERS_CREATE', 'CUSTOMERS_UPDATE', 'CUSTOMERS_DELETE',
        'REMINDERS_CREATE', 'REMINDERS_UPDATE', 'REMINDERS_DELETE',
        'SETTINGS_PERMISSIONS_VIEW', 'SETTINGS_PERMISSIONS_CREATE', 'SETTINGS_PERMISSIONS_UPDATE', 'SETTINGS_PERMISSIONS_DELETE',
        'SETTINGS_REMINDERS_VIEW', 'SETTINGS_REMINDERS_CREATE', 'SETTINGS_REMINDERS_UPDATE', 'SETTINGS_REMINDERS_DELETE',
        'SETTINGS_SYSTEM_VIEW', 'SETTINGS_SYSTEM_CREATE', 'SETTINGS_SYSTEM_UPDATE', 'SETTINGS_SYSTEM_DELETE',
        'SETTINGS_CUSTOMER_PANEL_VIEW', 'SETTINGS_CUSTOMER_PANEL_CREATE', 'SETTINGS_CUSTOMER_PANEL_UPDATE', 'SETTINGS_CUSTOMER_PANEL_DELETE',
        'MARKETING_DASHBOARD_VIEW', 'MARKETING_DASHBOARD_CREATE', 'MARKETING_DASHBOARD_UPDATE', 'MARKETING_DASHBOARD_DELETE',
        'MARKETING_CAMPAIGNS_VIEW', 'MARKETING_CAMPAIGNS_CREATE', 'MARKETING_CAMPAIGNS_UPDATE', 'MARKETING_CAMPAIGNS_DELETE',
        'MARKETING_ATTRIBUTION_VIEW', 'MARKETING_ATTRIBUTION_CREATE', 'MARKETING_ATTRIBUTION_UPDATE', 'MARKETING_ATTRIBUTION_DELETE'
    )
    AND (p.parent_permission_id IS NULL 
         OR NOT EXISTS (
             SELECT 1 FROM permissions parent 
             WHERE parent.id = p.parent_permission_id 
             AND parent.type = 'MODULE'
         ));
    
    IF orphaned_count > 0 THEN
        RAISE EXCEPTION 'CRITICAL: Found % orphaned ACTION permissions without valid MODULE parent', orphaned_count;
    END IF;
    
    RAISE NOTICE 'SUCCESS: All new ACTION permissions have valid MODULE parents';
END $$;
