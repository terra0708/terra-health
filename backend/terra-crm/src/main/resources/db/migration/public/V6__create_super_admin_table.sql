-- Create super_admin_users table in public schema
-- This table tracks which users have super admin privileges
-- Super admins can assign modules to any tenant

CREATE TABLE IF NOT EXISTS super_admin_users (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_super_admin_users_user_id ON super_admin_users(user_id);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_super_admin_users_updated_at
    BEFORE UPDATE ON super_admin_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
