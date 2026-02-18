-- Add Google rating and review count fields
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS google_rating NUMERIC(3, 2) NULL,
ADD COLUMN IF NOT EXISTS google_review_count INTEGER NULL,
ADD COLUMN IF NOT EXISTS twitter_url TEXT NULL,
ADD COLUMN IF NOT EXISTS x_url TEXT NULL;

COMMENT ON COLUMN public.restaurants.google_rating IS 'Google Business rating (0.0 to 5.0)';
COMMENT ON COLUMN public.restaurants.google_review_count IS 'Number of Google reviews';
COMMENT ON COLUMN public.restaurants.twitter_url IS 'Twitter profile URL (legacy)';
COMMENT ON COLUMN public.restaurants.x_url IS 'X (Twitter) profile URL';

