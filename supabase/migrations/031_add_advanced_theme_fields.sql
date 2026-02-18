-- Add advanced theme fields to restaurants table
-- These fields allow more customization of menu appearance

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS theme_font TEXT DEFAULT 'Inter',
ADD COLUMN IF NOT EXISTS theme_border_radius INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS theme_shadow TEXT DEFAULT 'lg',
ADD COLUMN IF NOT EXISTS theme_hover TEXT DEFAULT NULL;

-- Add check constraint for theme_shadow
ALTER TABLE restaurants
ADD CONSTRAINT check_theme_shadow CHECK (theme_shadow IN ('none', 'sm', 'md', 'lg', 'xl'));

-- Add check constraint for theme_border_radius (0-24)
ALTER TABLE restaurants
ADD CONSTRAINT check_theme_border_radius CHECK (theme_border_radius >= 0 AND theme_border_radius <= 24);

-- Add comments for documentation
COMMENT ON COLUMN restaurants.theme_font IS 'Font family for menu text (e.g., Inter, Roboto, Poppins)';
COMMENT ON COLUMN restaurants.theme_border_radius IS 'Border radius in pixels (0-24)';
COMMENT ON COLUMN restaurants.theme_shadow IS 'Shadow level: none, sm, md, lg, xl';
COMMENT ON COLUMN restaurants.theme_hover IS 'Hover color for buttons and cards (hex format)';
