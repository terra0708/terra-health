-- Create maintenance_mode table for global and tenant-specific maintenance mode

CREATE TABLE IF NOT EXISTS maintenance_mode (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID, -- NULL for global maintenance mode
    active BOOLEAN NOT NULL DEFAULT false,
    message TEXT,
    scheduled_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_mode_tenant_id ON maintenance_mode(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_mode_active ON maintenance_mode(active);
CREATE INDEX IF NOT EXISTS idx_maintenance_mode_deleted ON maintenance_mode(deleted);

-- Foreign key constraint (optional)
ALTER TABLE maintenance_mode
ADD CONSTRAINT fk_maintenance_mode_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;

-- Unique constraint: Only one global maintenance mode and one per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_mode_global_unique ON maintenance_mode(tenant_id) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_maintenance_mode_tenant_unique ON maintenance_mode(tenant_id) WHERE tenant_id IS NOT NULL;
