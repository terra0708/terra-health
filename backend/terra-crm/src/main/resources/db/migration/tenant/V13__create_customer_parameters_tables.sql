-- Create customer categories table
CREATE TABLE customer_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT uq_category_label_en UNIQUE (label_en, deleted_at)
);

-- Create customer services table
CREATE TABLE customer_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_tr VARCHAR(100) NOT NULL,
    name_en VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    category_id UUID NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#a259ff',
    icon VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES customer_categories(id),
    CONSTRAINT uq_service_name_en UNIQUE (name_en, deleted_at)
);

-- Create customer statuses table
CREATE TABLE customer_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
    icon VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT uq_status_value UNIQUE (value, deleted_at)
);

-- Create customer sources table
CREATE TABLE customer_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#6b7280',
    icon VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT uq_source_value UNIQUE (value, deleted_at)
);

-- Create customer tags table
CREATE TABLE customer_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL,
    value VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#8b5cf6',
    icon VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT uq_tag_value UNIQUE (value, deleted_at)
);

-- Create customer file categories table
CREATE TABLE customer_file_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label_tr VARCHAR(100) NOT NULL,
    label_en VARCHAR(100) NOT NULL,
    color VARCHAR(20) NOT NULL DEFAULT '#64748b',
    icon VARCHAR(50),
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    deleted_by UUID,
    CONSTRAINT uq_file_category_label_en UNIQUE (label_en, deleted_at)
);

-- Create indexes
CREATE INDEX idx_customer_categories_deleted_at ON customer_categories(deleted_at);
CREATE INDEX idx_customer_services_category_id ON customer_services(category_id);
CREATE INDEX idx_customer_services_deleted_at ON customer_services(deleted_at);
CREATE INDEX idx_customer_statuses_deleted_at ON customer_statuses(deleted_at);
CREATE INDEX idx_customer_sources_deleted_at ON customer_sources(deleted_at);
CREATE INDEX idx_customer_tags_deleted_at ON customer_tags(deleted_at);
CREATE INDEX idx_customer_file_categories_deleted_at ON customer_file_categories(deleted_at);

-- Insert system default categories
INSERT INTO customer_categories (id, label_tr, label_en, color, icon, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Sistem', 'System', '#6366f1', 'settings', TRUE),
    (gen_random_uuid(), 'Estetik', 'Aesthetics', '#a259ff', 'sparkles', FALSE),
    (gen_random_uuid(), 'Obezite', 'Obesity', '#3b82f6', 'activity', FALSE),
    (gen_random_uuid(), 'Diş', 'Dental', '#10b981', 'smile', FALSE),
    (gen_random_uuid(), 'Göz', 'Eye', '#f472b6', 'eye', FALSE);

-- Insert system default services
INSERT INTO customer_services (name_tr, name_en, value, category_id, color, icon, is_system) VALUES
    ('Saç Ekimi', 'Hair Transplant', 'sac_ekimi', (SELECT id FROM customer_categories WHERE label_en = 'Aesthetics'), '#a259ff', 'scissors', FALSE),
    ('Diş Tedavisi', 'Dental Treatment', 'dis_tedavisi', (SELECT id FROM customer_categories WHERE label_en = 'Dental'), '#3b82f6', 'tooth', FALSE),
    ('Rinoplasti', 'Rhinoplasty', 'rinoplasti', (SELECT id FROM customer_categories WHERE label_en = 'Aesthetics'), '#10b981', 'wind', FALSE),
    ('Liposuction', 'Liposuction', 'liposuction', (SELECT id FROM customer_categories WHERE label_en = 'Aesthetics'), '#f472b6', 'droplet', FALSE),
    ('Diş Beyazlatma', 'Teeth Whitening', 'dis_beyazlatma', (SELECT id FROM customer_categories WHERE label_en = 'Dental'), '#06b6d4', 'sparkles', FALSE),
    ('Gülüş Tasarımı', 'Smile Design', 'gulus_tasarimi', (SELECT id FROM customer_categories WHERE label_en = 'Dental'), '#f59e0b', 'smile', FALSE),
    ('Estetik Cerrahi', 'Plastic Surgery', 'estetik_cerrahi', (SELECT id FROM customer_categories WHERE label_en = 'Aesthetics'), '#ec4899', 'scalpel', FALSE),
    ('Burun Estetiği', 'Nose Job', 'burun_estetigi', (SELECT id FROM customer_categories WHERE label_en = 'Aesthetics'), '#8b5cf6', 'wind', FALSE);

-- Insert system default statuses
INSERT INTO customer_statuses (label_tr, label_en, value, color, icon, is_system) VALUES
    ('Yeni', 'New', 'new', '#3b82f6', 'plus-circle', TRUE),
    ('İşlemde', 'In Process', 'process', '#f59e0b', 'clock', FALSE),
    ('İletişime Geçildi', 'Contacted', 'contacted', '#8b5cf6', 'phone', FALSE),
    ('Randevu', 'Appointment', 'appointment', '#10b981', 'calendar', FALSE),
    ('Operasyon Sonrası', 'Post Op', 'post_op', '#6366f1', 'heart-pulse', FALSE),
    ('Kaybedildi', 'Lost', 'lost', '#ef4444', 'x-circle', FALSE),
    ('Satış', 'Sale', 'sale', '#10b981', 'check-circle', FALSE);

-- Insert system default sources
INSERT INTO customer_sources (label_tr, label_en, value, color, icon, is_system) VALUES
    ('Manuel Eklendi', 'Added Manually', 'manual', '#6b7280', 'user-plus', TRUE),
    ('Google Ads', 'Google Ads', 'google_ads', '#3b82f6', 'search', FALSE),
    ('Facebook Ads', 'Facebook Ads', 'facebook_ads', '#10b981', 'facebook', FALSE),
    ('Instagram Ads', 'Instagram Ads', 'instagram_ads', '#ec4899', 'instagram', FALSE),
    ('Tavsiye', 'Referral', 'referral', '#8b5cf6', 'users', FALSE);

-- Insert system default tags
INSERT INTO customer_tags (label_tr, label_en, value, color, icon, is_system) VALUES
    ('VIP', 'VIP', 'vip', '#8b5cf6', 'crown', FALSE),
    ('Öncelikli', 'Priority', 'oncelikli', '#ef4444', 'flag', FALSE),
    ('İngilizce', 'English', 'ingilizce', '#3b82f6', 'globe', FALSE),
    ('Arapça', 'Arabic', 'arapca', '#10b981', 'globe', FALSE),
    ('Rusça', 'Russian', 'rusca', '#f43f5e', 'globe', FALSE),
    ('Almanca', 'German', 'almanca', '#f59e0b', 'globe', FALSE);

-- Insert system default file categories
INSERT INTO customer_file_categories (label_tr, label_en, color, icon, is_system) VALUES
    ('Kimlik Belgeleri', 'Identity Documents', '#312e81', 'id-card', TRUE),
    ('Tıbbi Raporlar', 'Medical Reports', '#ef4444', 'file-text', FALSE),
    ('Ödeme Makbuzları', 'Payment Receipts', '#10b981', 'receipt', FALSE),
    ('Fotoğraflar', 'Photos', '#f59e0b', 'image', FALSE),
    ('Uçuş ve Konaklama', 'Flight & Stay', '#6366f1', 'plane', FALSE),
    ('Diğer', 'Other', '#64748b', 'folder', FALSE);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_customer_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_categories_updated_at
    BEFORE UPDATE ON customer_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_categories_updated_at();

CREATE TRIGGER trigger_update_customer_services_updated_at
    BEFORE UPDATE ON customer_services
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_categories_updated_at();

CREATE TRIGGER trigger_update_customer_statuses_updated_at
    BEFORE UPDATE ON customer_statuses
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_categories_updated_at();

CREATE TRIGGER trigger_update_customer_sources_updated_at
    BEFORE UPDATE ON customer_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_categories_updated_at();

CREATE TRIGGER trigger_update_customer_tags_updated_at
    BEFORE UPDATE ON customer_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_categories_updated_at();

CREATE TRIGGER trigger_update_customer_file_categories_updated_at
    BEFORE UPDATE ON customer_file_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_categories_updated_at();
