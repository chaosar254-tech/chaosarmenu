-- Migration 032: Add subscription tracking fields to restaurants table
-- This migration adds subscription status, plan, period end, and Iyzico reference
-- for implementing SaaS subscription model with soft lock mechanism

-- Add subscription fields to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('starter', 'standard', 'premium')) DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS subscription_status TEXT CHECK (subscription_status IN ('active', 'past_due', 'canceled')) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS iyzico_sub_reference TEXT;

-- Create indexes for subscription fields (for querying by status)
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_status ON restaurants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_restaurants_current_period_end ON restaurants(current_period_end);
CREATE INDEX IF NOT EXISTS idx_restaurants_iyzico_sub_reference ON restaurants(iyzico_sub_reference);

-- Add comments for documentation
COMMENT ON COLUMN restaurants.subscription_plan IS 'Current subscription plan: starter, standard, or premium';
COMMENT ON COLUMN restaurants.subscription_status IS 'Subscription status: active (paid), past_due (payment failed), or canceled';
COMMENT ON COLUMN restaurants.current_period_end IS 'End date of current subscription period (used for soft lock check)';
COMMENT ON COLUMN restaurants.iyzico_sub_reference IS 'Iyzico subscription reference/token for payment tracking';

-- Update existing restaurants to have active status with default period end (30 days from now)
-- This ensures existing users are not locked out immediately
UPDATE restaurants
SET 
  subscription_status = 'active',
  subscription_plan = COALESCE(plan, 'starter'),
  current_period_end = COALESCE(current_period_end, NOW() + INTERVAL '30 days')
WHERE subscription_status IS NULL;

-- Ensure all restaurants have a valid subscription_plan (migrate from 'plan' column if needed)
UPDATE restaurants
SET subscription_plan = CASE 
  WHEN plan = 'starter' THEN 'starter'
  WHEN plan = 'standard' THEN 'standard'
  WHEN plan = 'premium' THEN 'premium'
  ELSE 'starter'
END
WHERE subscription_plan IS NULL;
