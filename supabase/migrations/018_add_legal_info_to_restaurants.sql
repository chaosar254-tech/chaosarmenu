-- Add legal information columns to restaurants table
-- For displaying mandatory legal info on menu UI

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS include_vat BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS has_service_fee BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_cover_charge BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.restaurants.include_vat IS 'Whether prices include VAT (KDV dahil)';
COMMENT ON COLUMN public.restaurants.has_service_fee IS 'Whether service fee is charged (servis ücreti)';
COMMENT ON COLUMN public.restaurants.has_cover_charge IS 'Whether cover charge is applied (kuver ücreti)';

