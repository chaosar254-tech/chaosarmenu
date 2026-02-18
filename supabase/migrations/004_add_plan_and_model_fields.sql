-- Add plan column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'starter' CHECK (plan IN ('starter', 'standard', 'premium'));

-- Add index for plan column (for filtering/querying)
CREATE INDEX IF NOT EXISTS idx_restaurants_plan ON restaurants(plan);

-- Add comment for documentation
COMMENT ON COLUMN restaurants.plan IS 'Subscription plan: starter, standard, or premium';

-- Add model_glb and model_usdz columns to menu_items table
-- (These are alternative naming to ar_model_glb/ar_model_usdz)
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS model_glb TEXT,
ADD COLUMN IF NOT EXISTS model_usdz TEXT;

-- Add comments for documentation
COMMENT ON COLUMN menu_items.model_glb IS 'GLB model file path for AR (Android/Web)';
COMMENT ON COLUMN menu_items.model_usdz IS 'USDZ model file path for AR (iOS Quick Look)';

-- Note: has_ar column already exists from migration 003
-- Note: RLS policies already cover these new columns (public read policy includes all columns)

