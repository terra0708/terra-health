-- V21: Create permission dictionary table
-- This table documents all permission abbreviations used in PermissionMapper
-- Purpose: Centralized documentation and future-proofing for dynamic loading

-- 1. Create permission_dictionary table
CREATE TABLE IF NOT EXISTS permission_dictionary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('MODULE', 'SUBMODULE', 'ACTION')),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_permission_dictionary_code ON permission_dictionary(code);
CREATE INDEX IF NOT EXISTS idx_permission_dictionary_category ON permission_dictionary(category);

-- 3. Populate MODULE abbreviations
INSERT INTO permission_dictionary (code, full_name, category, description)
VALUES 
    ('D', 'DASHBOARD', 'MODULE', 'Dashboard module'),
    ('APT', 'APPOINTMENTS', 'MODULE', 'Appointments module'),
    ('CUS', 'CUSTOMERS', 'MODULE', 'Customers module'),
    ('REM', 'REMINDERS', 'MODULE', 'Reminders module'),
    ('STAT', 'STATISTICS', 'MODULE', 'Statistics module'),
    ('NOT', 'NOTIFICATIONS', 'MODULE', 'Notifications module'),
    ('MKT', 'MARKETING', 'MODULE', 'Marketing module'),
    ('SET', 'SETTINGS', 'MODULE', 'Settings module'),
    ('HEA', 'HEALTH', 'MODULE', 'Health module (deprecated)'),
    ('SUP', 'SUPERADMIN', 'MODULE', 'Super Admin module')
ON CONFLICT (code) DO NOTHING;

-- 4. Populate SUBMODULE abbreviations
INSERT INTO permission_dictionary (code, full_name, category, description)
VALUES 
    ('USR', 'USERS', 'SUBMODULE', 'Users submodule'),
    ('TEN', 'TENANTS', 'SUBMODULE', 'Tenants submodule'),
    ('ROL', 'ROLES', 'SUBMODULE', 'Roles submodule'),
    ('SCH', 'SCHEMAPOOL', 'SUBMODULE', 'Schema Pool submodule'),
    ('CPN', 'CUSTOMER_PANEL', 'SUBMODULE', 'Customer Panel submodule'),
    ('SYS', 'SYSTEM', 'SUBMODULE', 'System submodule'),
    ('PAT', 'PATIENTS', 'SUBMODULE', 'Patients submodule'),
    ('CAM', 'CAMPAIGNS', 'SUBMODULE', 'Campaigns submodule'),
    ('ATT', 'ATTRIBUTION', 'SUBMODULE', 'Attribution submodule'),
    ('DSH', 'DASHBOARD', 'SUBMODULE', 'Dashboard submodule')
ON CONFLICT (code) DO NOTHING;

-- 5. Populate ACTION abbreviations
INSERT INTO permission_dictionary (code, full_name, category, description)
VALUES 
    ('V', 'VIEW', 'ACTION', 'View action'),
    ('C', 'CREATE', 'ACTION', 'Create action'),
    ('U', 'UPDATE', 'ACTION', 'Update action'),
    ('D', 'DELETE', 'ACTION', 'Delete action'),
    ('E', 'EDIT', 'ACTION', 'Edit action'),
    ('M', 'MANAGE', 'ACTION', 'Manage action'),
    ('MOD', 'MODULE', 'ACTION', 'Module suffix (special)')
ON CONFLICT (code) DO NOTHING;
