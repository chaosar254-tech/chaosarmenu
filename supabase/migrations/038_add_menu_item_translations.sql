-- Migration 038: Add translation columns to menu_items (EN/AR name and description)
-- Used by customer menu when language is switched; fallback to Turkish if null.

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT;

COMMENT ON COLUMN menu_items.name_en IS 'Product name in English (for menu language switch)';
COMMENT ON COLUMN menu_items.name_ar IS 'Product name in Arabic (for menu language switch)';
COMMENT ON COLUMN menu_items.description_en IS 'Product description in English';
COMMENT ON COLUMN menu_items.description_ar IS 'Product description in Arabic';
