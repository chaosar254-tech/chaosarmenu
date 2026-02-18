-- Add AR model fields to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS has_ar BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ar_model_glb TEXT,
ADD COLUMN IF NOT EXISTS ar_model_usdz TEXT;

-- Add comments for documentation
COMMENT ON COLUMN menu_items.has_ar IS 'Whether this item has AR support';
COMMENT ON COLUMN menu_items.ar_model_glb IS 'GLB model file path for AR (Android/Web)';
COMMENT ON COLUMN menu_items.ar_model_usdz IS 'USDZ model file path for AR (iOS Quick Look)';

-- Update existing RLS policy to allow public read of AR fields
-- (Already covered by existing public read policy on menu_items)

