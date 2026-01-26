-- Create schema_pool table for pre-provisioned tenant schemas
-- This enables fast tenant provisioning by using pre-migrated schemas from a pool

CREATE TABLE IF NOT EXISTS schema_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schema_name VARCHAR(63) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_schema_pool_status ON schema_pool(status);
CREATE INDEX IF NOT EXISTS idx_schema_pool_status_created ON schema_pool(status, created_at);
CREATE INDEX IF NOT EXISTS idx_schema_pool_schema_name ON schema_pool(schema_name);
CREATE INDEX IF NOT EXISTS idx_schema_pool_deleted ON schema_pool(deleted);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_schema_pool_updated_at
    BEFORE UPDATE ON schema_pool
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
