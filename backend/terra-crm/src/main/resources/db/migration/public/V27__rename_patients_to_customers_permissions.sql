-- V27: Rename PATIENTS to CUSTOMERS in permissions and update dictionary
-- This migration handles the renaming and fixes the unique constraint in permission_dictionary

-- 1. Rename PATIENTS to CUSTOMERS in permissions table
-- This applies to all granular permissions that might use the old naming
UPDATE permissions SET name = REPLACE(name, 'PATIENTS', 'CUSTOMERS') WHERE name LIKE '%PATIENTS%';
UPDATE permissions SET description = REPLACE(description, 'Patients', 'Customers') WHERE description LIKE '%Patients%';

-- 2. Fix permission_dictionary constraint to allow same code for different categories
-- PermissionMapper uses 'D' for DASHBOARD (Module) and 'D' for DELETE (Action)
-- It also now uses 'CUS' for both CUSTOMERS (Module) and CUSTOMERS (Submodule)

-- DROP ALL existing unique constraints on 'code' column regardless of their name
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'permission_dictionary'::regclass 
        AND contype = 'u'
    ) LOOP
        EXECUTE 'ALTER TABLE permission_dictionary DROP CONSTRAINT ' || r.conname;
    END LOOP;
END $$;

-- Drop standard name just in case it's not detected as 'u'
ALTER TABLE permission_dictionary DROP CONSTRAINT IF EXISTS permission_dictionary_code_key;

-- Clean up any duplicates before adding the new composite constraint
-- In case V21 was partially applied or data is already duplicated
DELETE FROM permission_dictionary a USING permission_dictionary b
WHERE a.id < b.id 
AND a.code = b.code 
AND a.category = b.category;

-- Add the new robust composite constraint
ALTER TABLE permission_dictionary ADD CONSTRAINT permission_dictionary_code_category_key UNIQUE (code, category);

-- 3. Update permission_dictionary entries for PATIENTS
-- Ensure we don't create a (CUS, SUBMODULE) duplicate if one already exists
UPDATE permission_dictionary 
SET full_name = 'CUSTOMERS', 
    code = 'CUS',
    description = 'Customers submodule'
WHERE full_name = 'PATIENTS';

-- 4. Re-insert missing dictionary entries that might have been skipped in V21
-- These are critical for PermissionMapper to work correctly for all users
INSERT INTO permission_dictionary (code, full_name, category, description)
VALUES 
    ('D', 'DELETE', 'ACTION', 'Delete action'),
    ('M', 'MANAGE', 'ACTION', 'Manage action'),
    ('CUS', 'CUSTOMERS', 'SUBMODULE', 'Customers submodule')
ON CONFLICT (code, category) DO NOTHING;
