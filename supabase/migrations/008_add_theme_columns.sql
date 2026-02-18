-- Add theme color columns to restaurants table
-- These columns allow per-restaurant customization of menu appearance

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS theme_primary TEXT DEFAULT '#D4AF37',
ADD COLUMN IF NOT EXISTS theme_bg TEXT DEFAULT '#0B0B0F',
ADD COLUMN IF NOT EXISTS theme_card TEXT DEFAULT '#15151B',
ADD COLUMN IF NOT EXISTS theme_text TEXT DEFAULT '#F5F5F5',
ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'dark';

-- Add check constraint for theme_mode
ALTER TABLE restaurants
ADD CONSTRAINT check_theme_mode CHECK (theme_mode IN ('dark', 'light'));

-- Add comments for documentation
COMMENT ON COLUMN restaurants.theme_primary IS 'Primary accent color (hex format, e.g., #D4AF37)';
COMMENT ON COLUMN restaurants.theme_bg IS 'Background color (hex format, e.g., #0B0B0F)';
COMMENT ON COLUMN restaurants.theme_card IS 'Card/container background color (hex format, e.g., #15151B)';
COMMENT ON COLUMN restaurants.theme_text IS 'Text color (hex format, e.g., #F5F5F5)';
COMMENT ON COLUMN restaurants.theme_mode IS 'Theme mode: dark or light';

