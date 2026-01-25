-- Create permissions table in public schema
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('MODULE', 'ACTION')),
    parent_permission_id UUID REFERENCES permissions(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on permission type for faster lookups
CREATE INDEX IF NOT EXISTS idx_permissions_type ON permissions(type);
-- Create index on parent_permission_id for action-level permissions
CREATE INDEX IF NOT EXISTS idx_permissions_parent_id ON permissions(parent_permission_id);

-- Create tenant_modules junction table (Many-to-Many)
-- Tracks which modules each tenant has access to
CREATE TABLE IF NOT EXISTS tenant_modules (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, permission_id)
);

-- Create indexes for tenant_modules
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant_id ON tenant_modules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_permission_id ON tenant_modules(permission_id);

-- Create user_permissions junction table (Many-to-Many)
-- Tracks which permissions each user has
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id)
);

-- Create indexes for user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Create triggers to automatically update updated_at for permissions
CREATE TRIGGER update_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_modules_updated_at
    BEFORE UPDATE ON tenant_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_permissions_updated_at
    BEFORE UPDATE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Seed MODULE-level permissions (extracted from Sidebar.jsx)
-- These represent the main modules in the application
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at) VALUES
-- Core Modules
(gen_random_uuid(), 'MODULE_DASHBOARD', 'Dashboard module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_APPOINTMENTS', 'Appointments module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_CUSTOMERS', 'Customers module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_REMINDERS', 'Reminders module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_STATISTICS', 'Statistics module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_NOTIFICATIONS', 'Notifications module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_MARKETING', 'Marketing/Ads module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), 'MODULE_SETTINGS', 'Settings module access', 'MODULE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (name) DO NOTHING;

-- Seed ACTION-level permissions for each module
-- For each module, create VIEW, CREATE, UPDATE, DELETE actions
-- We'll use a CTE to get module IDs and insert actions

-- Dashboard actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'DASHBOARD_' || action,
    'Dashboard ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_DASHBOARD'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Appointments actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'APPOINTMENTS_' || action,
    'Appointments ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_APPOINTMENTS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW'), ('CREATE'), ('UPDATE'), ('DELETE')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Customers actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'CUSTOMERS_' || action,
    'Customers ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_CUSTOMERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW'), ('CREATE'), ('UPDATE'), ('DELETE')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Reminders actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'REMINDERS_' || action,
    'Reminders ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_REMINDERS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW'), ('CREATE'), ('UPDATE'), ('DELETE')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Statistics actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'STATISTICS_' || action,
    'Statistics ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_STATISTICS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Notifications actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'NOTIFICATIONS_' || action,
    'Notifications ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_NOTIFICATIONS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW'), ('CREATE'), ('UPDATE'), ('DELETE')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Marketing actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'MARKETING_' || action,
    'Marketing ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_MARKETING'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW'), ('CREATE'), ('UPDATE'), ('DELETE')) AS actions(action)
ON CONFLICT (name) DO NOTHING;

-- Settings actions
INSERT INTO permissions (id, name, description, type, parent_permission_id, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    'SETTINGS_' || action,
    'Settings ' || LOWER(action) || ' permission',
    'ACTION',
    (SELECT id FROM permissions WHERE name = 'MODULE_SETTINGS'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM (VALUES ('VIEW'), ('UPDATE')) AS actions(action)
ON CONFLICT (name) DO NOTHING;
