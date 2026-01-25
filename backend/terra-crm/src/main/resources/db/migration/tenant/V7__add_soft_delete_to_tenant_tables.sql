-- Add soft delete columns to all tenant schema tables
-- This migration adds deleted and deleted_at columns to support soft delete functionality

-- Add soft delete to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE INDEX IF NOT EXISTS idx_services_deleted ON services(deleted);
CREATE INDEX IF NOT EXISTS idx_services_deleted_by ON services(deleted_by);

-- Add soft delete to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE INDEX IF NOT EXISTS idx_leads_deleted ON leads(deleted);
CREATE INDEX IF NOT EXISTS idx_leads_deleted_by ON leads(deleted_by);

-- Add soft delete to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_patients_deleted ON patients(deleted);

-- Add soft delete to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by UUID;

CREATE INDEX IF NOT EXISTS idx_appointments_deleted ON appointments(deleted);
CREATE INDEX IF NOT EXISTS idx_appointments_deleted_by ON appointments(deleted_by);
