-- Add optional service fee amount and customizable allergen disclaimer
-- to restaurants table

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS service_fee_amount DECIMAL(10, 2) NULL,
ADD COLUMN IF NOT EXISTS allergen_disclaimer TEXT NULL;

COMMENT ON COLUMN public.restaurants.service_fee_amount IS 'Optional service fee amount (numeric)';
COMMENT ON COLUMN public.restaurants.allergen_disclaimer IS 'Customizable allergen disclaimer text (defaults to standard text if null)';

