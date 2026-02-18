-- Add Google Place ID and rating cache timestamp
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS google_place_id TEXT NULL,
ADD COLUMN IF NOT EXISTS google_rating_updated_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.restaurants.google_place_id IS 'Google Places API Place ID (used to fetch rating/reviews)';
COMMENT ON COLUMN public.restaurants.google_rating_updated_at IS 'Timestamp when google_rating and google_review_count were last fetched from Google Places API';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_google_place_id ON public.restaurants(google_place_id) WHERE google_place_id IS NOT NULL;

