-- Add ingredients and recommended_item_ids columns to menu_items table
-- For Combo premium feature

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS ingredients text[] NULL;

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS recommended_item_ids uuid[] NULL;

COMMENT ON COLUMN public.menu_items.ingredients IS 'Array of ingredient names (max 20, each max 40 chars)';
COMMENT ON COLUMN public.menu_items.recommended_item_ids IS 'Array of recommended menu item IDs (max 6, cannot include self)';

