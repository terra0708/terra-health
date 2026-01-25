-- Refactor tenant_modules table from composite primary key to simple UUID ID
-- This fixes Hibernate 7 TableGroup.getModelPart() errors with @IdClass

-- Step 1: Add new id column
ALTER TABLE tenant_modules 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Step 2: Populate id for existing records (if any)
UPDATE tenant_modules 
SET id = gen_random_uuid() 
WHERE id IS NULL;

-- Step 3: Make id NOT NULL
ALTER TABLE tenant_modules 
ALTER COLUMN id SET NOT NULL;

-- Step 4: Drop the old composite primary key
ALTER TABLE tenant_modules 
DROP CONSTRAINT IF EXISTS tenant_modules_pkey;

-- Step 5: Add new primary key on id
ALTER TABLE tenant_modules 
ADD CONSTRAINT tenant_modules_pkey PRIMARY KEY (id);

-- Step 6: Add unique constraint on (tenant_id, permission_id) to maintain data integrity
ALTER TABLE tenant_modules 
ADD CONSTRAINT uk_tenant_modules_tenant_permission UNIQUE (tenant_id, permission_id);

-- Step 7: Add soft delete columns (if not already added by V4)
ALTER TABLE tenant_modules 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_tenant_modules_deleted ON tenant_modules(deleted);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_deleted_by ON tenant_modules(deleted_by);

-- Note: Existing indexes on tenant_id and permission_id from V3 are still valid
