-- Add missing deleted_by column to customers table for soft delete audit trail
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create index for deleted_by for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_deleted_by ON customers(deleted_by);
