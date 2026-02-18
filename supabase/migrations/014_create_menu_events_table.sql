-- Create menu_events table for analytics
CREATE TABLE IF NOT EXISTS menu_events (
  id BIGSERIAL PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  qr_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'scan', 'item_view', 'error')),
  item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_menu_events_restaurant ON menu_events(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_events_created_at ON menu_events(created_at);
CREATE INDEX IF NOT EXISTS idx_menu_events_type ON menu_events(event_type);
CREATE INDEX IF NOT EXISTS idx_menu_events_qr ON menu_events(qr_id);
CREATE INDEX IF NOT EXISTS idx_menu_events_item ON menu_events(item_id);
CREATE INDEX IF NOT EXISTS idx_menu_events_restaurant_date ON menu_events(restaurant_id, created_at);

-- Composite index for common analytics queries
CREATE INDEX IF NOT EXISTS idx_menu_events_restaurant_type_date 
  ON menu_events(restaurant_id, event_type, created_at);

-- Enable RLS
ALTER TABLE menu_events ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can read their own events
CREATE POLICY "Restaurant owners can read own events"
  ON menu_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_events.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Policy: Public can insert events (for analytics logging)
CREATE POLICY "Public can insert events"
  ON menu_events FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can manage all events (for admin)
-- Note: Service role bypasses RLS

-- Add comments
COMMENT ON TABLE menu_events IS 'Analytics events for menu interactions';
COMMENT ON COLUMN menu_events.event_type IS 'Type of event: page_view, scan, item_view, error';
COMMENT ON COLUMN menu_events.meta IS 'Additional event metadata (JSON)';

