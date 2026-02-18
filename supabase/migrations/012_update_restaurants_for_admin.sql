-- Update restaurants table for admin panel features
-- Add is_active column if not exists
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- Update plan column to use 'free' and 'premium' instead of 'starter/standard/premium'
-- First, update existing values
UPDATE restaurants SET plan = 'free' WHERE plan = 'starter';
UPDATE restaurants SET plan = 'premium' WHERE plan IN ('standard', 'premium');

-- Drop old constraint and add new one
ALTER TABLE restaurants
DROP CONSTRAINT IF EXISTS restaurants_plan_check;

ALTER TABLE restaurants
ADD CONSTRAINT restaurants_plan_check CHECK (plan IN ('free', 'premium'));

-- Set default to 'free'
ALTER TABLE restaurants
ALTER COLUMN plan SET DEFAULT 'free';

-- Add limits column for quotas/usages
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS limits JSONB DEFAULT '{}'::jsonb;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_restaurants_plan ON restaurants(plan);

-- Add comments
COMMENT ON COLUMN restaurants.is_active IS 'Whether the restaurant is active/enabled';
COMMENT ON COLUMN restaurants.plan IS 'Subscription plan: free or premium';
COMMENT ON COLUMN restaurants.limits IS 'JSON object storing quotas and usages, e.g., {ar_used: 3, ar_quota: 10}';

