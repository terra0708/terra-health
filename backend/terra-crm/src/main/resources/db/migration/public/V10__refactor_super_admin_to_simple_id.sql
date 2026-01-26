-- Refactor super_admin_users table to use independent ID instead of shared primary key
-- This fixes Hibernate 7 compatibility issues with @MapsId/shared identifiers

-- Step 1: Add new id column
ALTER TABLE super_admin_users ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
ALTER TABLE super_admin_users ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT false;
ALTER TABLE super_admin_users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE super_admin_users ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Step 2: Populate id for existing records (if any)
UPDATE super_admin_users SET id = gen_random_uuid() WHERE id IS NULL;

-- Step 3: Make id NOT NULL and set as primary key
ALTER TABLE super_admin_users ALTER COLUMN id SET NOT NULL;
ALTER TABLE super_admin_users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 4: Drop old primary key constraint
ALTER TABLE super_admin_users DROP CONSTRAINT IF EXISTS super_admin_users_pkey;

-- Step 5: Create new primary key on id
ALTER TABLE super_admin_users ADD PRIMARY KEY (id);

-- Step 6: Ensure user_id is unique (foreign key with unique constraint)
ALTER TABLE super_admin_users DROP CONSTRAINT IF EXISTS uk_super_admin_user_id;
ALTER TABLE super_admin_users ADD CONSTRAINT uk_super_admin_user_id UNIQUE (user_id);

-- Step 7: Add indexes for soft delete
CREATE INDEX IF NOT EXISTS idx_super_admin_users_deleted ON super_admin_users(deleted);
CREATE INDEX IF NOT EXISTS idx_super_admin_users_deleted_by ON super_admin_users(deleted_by);
