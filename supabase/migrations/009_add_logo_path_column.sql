-- Add logo_path column to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS logo_path TEXT;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.logo_path IS 'Storage path in menu_logos bucket (e.g., restaurant-id/logo.ext)';

