-- Add allergens column to menu_items table
-- Ingredients already exists from migration 017

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS allergens text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.menu_items.allergens IS 'Array of allergen identifiers (max 20, must be from allowed set)';
COMMENT ON COLUMN public.menu_items.ingredients IS 'Array of ingredient names (max 20, each max 40 chars) - already exists from migration 017';

