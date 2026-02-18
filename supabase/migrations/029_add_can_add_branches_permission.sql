-- Add can_add_branches permission column to restaurants table
-- This allows admin to control whether restaurant owners can add new branches

ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS can_add_branches BOOLEAN DEFAULT false NOT NULL;

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_can_add_branches ON restaurants(can_add_branches);

-- Comment
COMMENT ON COLUMN restaurants.can_add_branches IS 'Whether the restaurant owner can add new branches. Controlled by admin panel.';
