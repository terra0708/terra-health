-- =====================================================
-- File Management System Tables
-- =====================================================

-- Create file_categories table
CREATE TABLE file_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_system_default BOOLEAN DEFAULT FALSE,
    is_deletable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

CREATE INDEX idx_file_categories_deleted ON file_categories(deleted);

-- Create customer_files table
CREATE TABLE customer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    category_id UUID NOT NULL,
    
    -- File Info
    original_filename VARCHAR(500) NOT NULL,
    display_name VARCHAR(500) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100),
    file_size BIGINT NOT NULL,
    
    -- Audit
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    
    -- Soft Delete
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_customer_files_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    CONSTRAINT fk_customer_files_category FOREIGN KEY (category_id) REFERENCES file_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_customer_files_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id),
    CONSTRAINT fk_customer_files_updated_by FOREIGN KEY (updated_by) REFERENCES users(id),
    CONSTRAINT fk_customer_files_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id)
);

CREATE INDEX idx_customer_files_customer ON customer_files(customer_id);
CREATE INDEX idx_customer_files_category ON customer_files(category_id);
CREATE INDEX idx_customer_files_deleted ON customer_files(is_deleted, deleted_at);

-- Insert default categories (Genel and Arşiv)
INSERT INTO file_categories (label_tr, label_en, color, is_system_default, is_deletable)
VALUES 
    ('Genel', 'General', '#6366f1', true, false),
    ('Arşiv', 'Archive', '#8b5cf6', true, false);

-- Add comment
COMMENT ON TABLE file_categories IS 'Tenant-scoped file categories for organizing customer files';
COMMENT ON TABLE customer_files IS 'Customer file metadata with soft delete support';
