-- Add domain and max_users quota to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10;

-- Update SYSTEM tenant domain
UPDATE tenants SET domain = 'terra.com' WHERE schema_name = 'public';
