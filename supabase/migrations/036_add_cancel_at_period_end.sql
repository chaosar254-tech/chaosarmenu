-- Migration 036: Add cancel_at_period_end to restaurants
-- When user cancels subscription, we set this to true. User keeps access until current_period_end.

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN restaurants.cancel_at_period_end IS 'User requested cancel; access until current_period_end, then treat as canceled';
