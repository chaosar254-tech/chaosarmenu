-- Add image_url column to menu_categories table
ALTER TABLE public.menu_categories
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment for clarity
COMMENT ON COLUMN public.menu_categories.image_url IS 'Storage path for category image: categories/{restaurantId}/{filename}';

