-- Add deleted column to all customer parameter tables
ALTER TABLE customer_categories ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customer_services ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customer_statuses ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customer_sources ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customer_tags ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE customer_file_categories ADD COLUMN IF NOT EXISTS deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Create indexes for deleted column
CREATE INDEX IF NOT EXISTS idx_customer_categories_deleted ON customer_categories(deleted);
CREATE INDEX IF NOT EXISTS idx_customer_services_deleted ON customer_services(deleted);
CREATE INDEX IF NOT EXISTS idx_customer_statuses_deleted ON customer_statuses(deleted);
CREATE INDEX IF NOT EXISTS idx_customer_sources_deleted ON customer_sources(deleted);
CREATE INDEX IF NOT EXISTS idx_customer_tags_deleted ON customer_tags(deleted);
CREATE INDEX IF NOT EXISTS idx_customer_file_categories_deleted ON customer_file_categories(deleted);
