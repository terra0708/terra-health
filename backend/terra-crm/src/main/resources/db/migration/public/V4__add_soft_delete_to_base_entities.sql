-- Add soft delete columns to all public schema tables
-- This migration adds deleted and deleted_at columns to support soft delete functionality

-- Add soft delete to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_tenants_deleted ON tenants(deleted);
CREATE INDEX IF NOT EXISTS idx_tenants_deleted_by ON tenants(deleted_by);

-- Add soft delete to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_users_deleted ON users(deleted);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON users(deleted_by);

-- Add soft delete to roles table
ALTER TABLE roles 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_roles_deleted ON roles(deleted);
CREATE INDEX IF NOT EXISTS idx_roles_deleted_by ON roles(deleted_by);

-- Add soft delete to permissions table
ALTER TABLE permissions 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_permissions_deleted ON permissions(deleted);
CREATE INDEX IF NOT EXISTS idx_permissions_deleted_by ON permissions(deleted_by);

-- Add soft delete to tenant_modules table
ALTER TABLE tenant_modules 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_deleted ON tenant_modules(deleted);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_deleted_by ON tenant_modules(deleted_by);

-- Add soft delete to user_permissions table
ALTER TABLE user_permissions 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_user_permissions_deleted ON user_permissions(deleted);
CREATE INDEX IF NOT EXISTS idx_user_permissions_deleted_by ON user_permissions(deleted_by);
