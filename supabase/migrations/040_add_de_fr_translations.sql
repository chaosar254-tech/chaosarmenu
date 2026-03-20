-- Migration 040: Add German and French translation columns to menu_items

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS name_de TEXT,
ADD COLUMN IF NOT EXISTS name_fr TEXT,
ADD COLUMN IF NOT EXISTS description_de TEXT,
ADD COLUMN IF NOT EXISTS description_fr TEXT;

COMMENT ON COLUMN menu_items.name_de IS 'Product name in German (for menu language switch)';
COMMENT ON COLUMN menu_items.name_fr IS 'Product name in French (for menu language switch)';
COMMENT ON COLUMN menu_items.description_de IS 'Product description in German';
COMMENT ON COLUMN menu_items.description_fr IS 'Product description in French';
