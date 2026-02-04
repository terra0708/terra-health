-- Change category column to categories (jsonb) in customers table
ALTER TABLE customers RENAME COLUMN category TO old_category;
ALTER TABLE customers ADD COLUMN categories jsonb DEFAULT '[]'::jsonb;

-- Migrate existing data if any (convert string category to [string])
UPDATE customers 
SET categories = jsonb_build_array(old_category) 
WHERE old_category IS NOT NULL;

-- Remove old column
ALTER TABLE customers DROP COLUMN old_category;
