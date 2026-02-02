-- User profiles table in tenant schemas
-- Stores tenant-specific personal information for users.
-- Auth identity (email, password hash, first/last name, roles) stays in public.users.

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tc_no VARCHAR(50),
    birth_date DATE,
    address TEXT,
    emergency_person VARCHAR(255),
    emergency_phone VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted ON user_profiles(deleted);
CREATE INDEX IF NOT EXISTS idx_user_profiles_deleted_by ON user_profiles(deleted_by);

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

