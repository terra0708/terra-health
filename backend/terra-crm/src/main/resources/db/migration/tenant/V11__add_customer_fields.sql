-- Add missing CRM fields to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS job VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS operation_type VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'new';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS consultant_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS source VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS registration_date TIMESTAMP;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS services JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS files JSONB;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payments JSONB;

-- Create index for consultant_id if not exists
CREATE INDEX IF NOT EXISTS idx_customers_consultant_id ON customers(consultant_id);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
