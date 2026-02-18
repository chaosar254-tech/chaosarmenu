-- Add image_path column to menu_items table
-- This stores the storage path (e.g., "restaurant-id/items/menu-item-id/uuid.ext")
-- image_url is kept for backward compatibility

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Add index for image_path queries
CREATE INDEX IF NOT EXISTS idx_menu_items_image_path ON menu_items(image_path) WHERE image_path IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN menu_items.image_path IS 'Storage path in menu_images bucket (e.g., restaurant-id/items/menu-item-id/uuid.ext)';
COMMENT ON COLUMN menu_items.image_url IS 'Legacy field for external URLs, kept for backward compatibility';

