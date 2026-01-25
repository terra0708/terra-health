-- Create permission_bundles table in public schema
CREATE TABLE IF NOT EXISTS permission_bundles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP
);

-- Create unique constraint on name per tenant (bundles can have same name in different tenants)
CREATE UNIQUE INDEX IF NOT EXISTS idx_permission_bundles_tenant_name ON permission_bundles(tenant_id, name) WHERE deleted = false;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permission_bundles_tenant_id ON permission_bundles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_permission_bundles_deleted ON permission_bundles(deleted);

-- Create bundle_permissions junction table (Many-to-Many)
-- Links bundles to permissions
CREATE TABLE IF NOT EXISTS bundle_permissions (
    bundle_id UUID NOT NULL REFERENCES permission_bundles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (bundle_id, permission_id)
);

-- Create indexes for bundle_permissions
CREATE INDEX IF NOT EXISTS idx_bundle_permissions_bundle_id ON bundle_permissions(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_permissions_permission_id ON bundle_permissions(permission_id);

-- Create user_bundles junction table (Many-to-Many)
-- Tracks which bundles are assigned to which users
CREATE TABLE IF NOT EXISTS user_bundles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bundle_id UUID NOT NULL REFERENCES permission_bundles(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, bundle_id)
);

-- Create indexes for user_bundles
CREATE INDEX IF NOT EXISTS idx_user_bundles_user_id ON user_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bundles_bundle_id ON user_bundles(bundle_id);

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_permission_bundles_updated_at
    BEFORE UPDATE ON permission_bundles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bundle_permissions_updated_at
    BEFORE UPDATE ON bundle_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_bundles_updated_at
    BEFORE UPDATE ON user_bundles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
