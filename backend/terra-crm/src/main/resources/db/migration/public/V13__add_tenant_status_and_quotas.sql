-- Add status and quota_limits columns to tenants table
-- Status: ACTIVE, SUSPENDED, DELETED
-- quota_limits: JSONB column for storing resource quotas per tenant

-- Create enum type for tenant status
DO $$ BEGIN
    CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add status column with default ACTIVE
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS status tenant_status NOT NULL DEFAULT 'ACTIVE';

-- Add quota_limits JSONB column
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS quota_limits JSONB DEFAULT '{}'::jsonb;

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- Create index for quota_limits queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_tenants_quota_limits ON tenants USING GIN (quota_limits);

-- Update existing tenants to ACTIVE status if they don't have one
UPDATE tenants
SET status = 'ACTIVE'
WHERE status IS NULL;
