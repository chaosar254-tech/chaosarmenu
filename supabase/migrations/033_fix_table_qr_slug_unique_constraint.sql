-- Fix restaurant_tables qr_slug to be unique per branch, not globally
-- This allows different restaurants/branches to have the same qr_slug

-- Step 1: Drop the existing global unique constraint on qr_slug
ALTER TABLE restaurant_tables DROP CONSTRAINT IF EXISTS restaurant_tables_qr_slug_key;

-- Step 2: Add composite unique constraint for (branch_id, qr_slug)
-- This ensures qr_slug is unique within each branch, but different branches can have the same qr_slug
ALTER TABLE restaurant_tables 
  ADD CONSTRAINT restaurant_tables_branch_qr_slug_unique UNIQUE (branch_id, qr_slug);

-- Step 3: Update the index to be composite (if needed for performance)
-- Drop old single-column index if it exists
DROP INDEX IF EXISTS idx_restaurant_tables_qr_slug;

-- Create composite index for better query performance
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_branch_qr_slug ON restaurant_tables(branch_id, qr_slug);

-- Comments
COMMENT ON CONSTRAINT restaurant_tables_branch_qr_slug_unique ON restaurant_tables IS 
  'Ensures qr_slug is unique within each branch, allowing different branches to have the same qr_slug';
