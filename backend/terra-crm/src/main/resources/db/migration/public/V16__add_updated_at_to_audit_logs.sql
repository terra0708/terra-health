-- Add updated_at column to audit_logs table
-- AuditLog entity extends BaseEntity which requires updated_at column

ALTER TABLE audit_logs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create index for updated_at (optional, for sorting/filtering)
CREATE INDEX IF NOT EXISTS idx_audit_logs_updated_at ON audit_logs(updated_at);
