-- Migration 037: Add supported_languages to restaurants (menüde gösterilecek diller)
-- Varsayılan: Türkçe, İngilizce, Arapça

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS supported_languages JSONB NOT NULL DEFAULT '["tr", "en", "ar"]'::jsonb;

COMMENT ON COLUMN restaurants.supported_languages IS 'Menüde dil seçicide gösterilecek diller. Örn: ["tr", "en", "ar"]. Restoran panelinden Dil Ayarları ile değiştirilir.';
