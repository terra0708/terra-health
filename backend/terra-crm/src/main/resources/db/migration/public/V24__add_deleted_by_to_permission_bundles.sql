-- Add deleted_by column to permission_bundles table
-- This column was missing from the original table creation but is part of BaseEntity

ALTER TABLE permission_bundles 
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_permission_bundles_deleted_by ON permission_bundles(deleted_by);
