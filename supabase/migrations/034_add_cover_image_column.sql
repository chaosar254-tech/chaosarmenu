-- Add cover_image column to restaurants table
-- This column stores the storage path for the restaurant's header/cover image
-- displayed at the top of the menu page

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS cover_image TEXT NULL;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.cover_image IS 'Storage path in menu_logos bucket for header/cover image (e.g., covers/{restaurant-id}/{uuid}.ext)';
