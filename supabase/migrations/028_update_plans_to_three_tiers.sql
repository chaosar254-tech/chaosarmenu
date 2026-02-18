-- Update restaurants table to support three plan tiers: starter, standard, premium
-- This replaces the previous two-tier system (free, premium)

-- First, update existing values
-- 'free' becomes 'starter'
UPDATE restaurants SET plan = 'starter' WHERE plan = 'free';

-- Drop old constraint
ALTER TABLE restaurants
DROP CONSTRAINT IF EXISTS restaurants_plan_check;

-- Add new constraint with three plans
ALTER TABLE restaurants
ADD CONSTRAINT restaurants_plan_check CHECK (plan IN ('starter', 'standard', 'premium'));

-- Update default to 'starter'
ALTER TABLE restaurants
ALTER COLUMN plan SET DEFAULT 'starter';

-- Update comment
COMMENT ON COLUMN restaurants.plan IS 'Subscription plan: starter (3 AR), standard (10 AR), or premium (unlimited AR)';
