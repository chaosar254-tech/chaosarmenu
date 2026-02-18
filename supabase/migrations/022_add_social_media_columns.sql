-- Add social media and Google review URL columns to restaurants table
-- For displaying contact and review links on the public menu

ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS google_review_url TEXT NULL,
ADD COLUMN IF NOT EXISTS instagram_url TEXT NULL,
ADD COLUMN IF NOT EXISTS tiktok_url TEXT NULL,
ADD COLUMN IF NOT EXISTS website_url TEXT NULL;

COMMENT ON COLUMN public.restaurants.google_review_url IS 'Google Business review page URL';
COMMENT ON COLUMN public.restaurants.instagram_url IS 'Instagram profile URL';
COMMENT ON COLUMN public.restaurants.tiktok_url IS 'TikTok profile URL';
COMMENT ON COLUMN public.restaurants.website_url IS 'Restaurant website URL';

