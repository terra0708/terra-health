-- Create reminder_categories table
CREATE TABLE reminder_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(20) DEFAULT '#6366f1',
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

-- Create reminder_subcategories table
CREATE TABLE reminder_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES reminder_categories(id) ON DELETE CASCADE,
    label_tr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    color VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

-- Create reminder_statuses table
CREATE TABLE reminder_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(255) NOT NULL,
    label_en VARCHAR(255) NOT NULL,
    value VARCHAR(255) NOT NULL,
    color VARCHAR(20) DEFAULT '#f59e0b',
    is_completed BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID
);

-- Create reminders table
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    note TEXT,
    reminder_date DATE NOT NULL,
    reminder_time TIME NOT NULL,
    
    category_id UUID NOT NULL REFERENCES reminder_categories(id),
    subcategory_id UUID REFERENCES reminder_subcategories(id),
    status_id UUID NOT NULL REFERENCES reminder_statuses(id),
    
    -- Related entity (customer, appointment, etc.)
    relation_type VARCHAR(50),
    relation_id UUID,
    
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    
    CONSTRAINT fk_relation CHECK (
        (relation_type = 'customer' AND relation_id IS NOT NULL) OR
        (relation_type = 'personal' AND relation_id IS NULL) OR
        (relation_type IS NULL)
    )
);

-- Create indexes for performance
CREATE INDEX idx_reminders_relation ON reminders(relation_type, relation_id) WHERE deleted = FALSE;
CREATE INDEX idx_reminders_date ON reminders(reminder_date) WHERE deleted = FALSE;
CREATE INDEX idx_reminders_status ON reminders(status_id) WHERE deleted = FALSE;
CREATE INDEX idx_reminders_category ON reminders(category_id) WHERE deleted = FALSE;
CREATE INDEX idx_reminder_categories_deleted ON reminder_categories(deleted);
CREATE INDEX idx_reminder_subcategories_deleted ON reminder_subcategories(deleted);
CREATE INDEX idx_reminder_subcategories_category ON reminder_subcategories(category_id) WHERE deleted = FALSE;
CREATE INDEX idx_reminder_statuses_deleted ON reminder_statuses(deleted);
