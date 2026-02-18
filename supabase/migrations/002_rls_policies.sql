-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;

-- Restaurants RLS Policies
-- Owners can view and manage their own restaurants
CREATE POLICY "Owners can view own restaurants"
  ON restaurants FOR SELECT
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can insert own restaurants"
  ON restaurants FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owners can update own restaurants"
  ON restaurants FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owners can delete own restaurants"
  ON restaurants FOR DELETE
  USING (auth.uid() = owner_user_id);

-- Public read access for active restaurants by slug (for menu display)
CREATE POLICY "Public can read restaurants by slug"
  ON restaurants FOR SELECT
  USING (true);

-- Menu Categories RLS Policies
-- Owners can manage categories for their restaurants
CREATE POLICY "Owners can manage own restaurant categories"
  ON menu_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_categories.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for active categories
CREATE POLICY "Public can read active categories"
  ON menu_categories FOR SELECT
  USING (is_active = true);

-- Menu Items RLS Policies
-- Owners can manage items for their restaurants
CREATE POLICY "Owners can manage own restaurant items"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = menu_items.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for active items
CREATE POLICY "Public can read active items"
  ON menu_items FOR SELECT
  USING (is_active = true);

-- QR Codes RLS Policies
-- Owners can manage QR codes for their restaurants
CREATE POLICY "Owners can manage own restaurant QR codes"
  ON qr_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = qr_codes.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for QR codes (needed for menu routing)
CREATE POLICY "Public can read QR codes"
  ON qr_codes FOR SELECT
  USING (true);

