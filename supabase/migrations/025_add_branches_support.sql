-- Multi-branch support for restaurants
-- This migration adds branches, branch-specific overrides, and branch social settings

-- 1. Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(restaurant_id, slug)
);

-- Indexes for branches
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_id ON branches(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_branches_restaurant_slug ON branches(restaurant_id, slug);
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON branches(is_active);

-- Comments
COMMENT ON TABLE branches IS 'Restaurant branches/locations';
COMMENT ON COLUMN branches.slug IS 'URL-friendly identifier for the branch (unique within restaurant)';

-- 2. Create tables table (restaurant seating/QR tables)
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  table_no TEXT NOT NULL,
  qr_slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(branch_id, table_no)
);

-- Indexes for restaurant_tables
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_branch_id ON restaurant_tables(branch_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_qr_slug ON restaurant_tables(qr_slug);
CREATE INDEX IF NOT EXISTS idx_restaurant_tables_branch_table_no ON restaurant_tables(branch_id, table_no);

-- Comments
COMMENT ON TABLE restaurant_tables IS 'Tables/seats within a branch, linked to QR codes';
COMMENT ON COLUMN restaurant_tables.qr_slug IS 'Unique slug used in QR code URLs';

-- 3. Create branch_menu_overrides table
CREATE TABLE IF NOT EXISTS branch_menu_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  price_override NUMERIC(10, 2),
  is_available BOOLEAN DEFAULT true NOT NULL,
  stock_status TEXT DEFAULT 'in_stock' NOT NULL CHECK (stock_status IN ('in_stock', 'out_of_stock', 'limited')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(branch_id, menu_item_id)
);

-- Indexes for branch_menu_overrides
CREATE INDEX IF NOT EXISTS idx_branch_menu_overrides_branch_id ON branch_menu_overrides(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_menu_overrides_menu_item_id ON branch_menu_overrides(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_branch_menu_overrides_availability ON branch_menu_overrides(branch_id, is_available, stock_status);

-- Comments
COMMENT ON TABLE branch_menu_overrides IS 'Branch-specific overrides for menu items (price, availability, stock)';
COMMENT ON COLUMN branch_menu_overrides.price_override IS 'Branch-specific price override. If NULL, uses menu_items.price';
COMMENT ON COLUMN branch_menu_overrides.stock_status IS 'Stock status: in_stock, out_of_stock, or limited';

-- 4. Create branch_social table
CREATE TABLE IF NOT EXISTS branch_social (
  branch_id UUID PRIMARY KEY REFERENCES branches(id) ON DELETE CASCADE,
  google_review_url TEXT,
  google_place_id TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  x_url TEXT,
  website_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for branch_social
CREATE INDEX IF NOT EXISTS idx_branch_social_branch_id ON branch_social(branch_id);

-- Comments
COMMENT ON TABLE branch_social IS 'Branch-specific social media and review links';

-- 5. Migrate existing QR codes to restaurant_tables
-- First, create a default branch for each restaurant (if branches don't exist)
DO $$
DECLARE
  r RECORD;
  default_branch_id UUID;
BEGIN
  FOR r IN 
    SELECT DISTINCT restaurant_id 
    FROM qr_codes 
    WHERE restaurant_id NOT IN (SELECT DISTINCT restaurant_id FROM branches)
    AND EXISTS (SELECT 1 FROM restaurants WHERE restaurants.id = qr_codes.restaurant_id)
  LOOP
    -- Create default branch for restaurant
    INSERT INTO branches (restaurant_id, name, slug, is_active)
    VALUES (r.restaurant_id, 'Ana Şube', 'ana-sub', true)
    ON CONFLICT (restaurant_id, slug) DO NOTHING
    RETURNING id INTO default_branch_id;
    
    -- If branch was created, migrate QR codes
    IF default_branch_id IS NOT NULL THEN
      INSERT INTO restaurant_tables (branch_id, table_no, qr_slug, is_active)
      SELECT 
        default_branch_id,
        COALESCE(table_no::TEXT, 'genel'),
        COALESCE(token, gen_random_uuid()::text),
        COALESCE(is_active, true)
      FROM qr_codes
      WHERE restaurant_id = r.restaurant_id
      ON CONFLICT (qr_slug) DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- 6. Enable RLS on all new tables
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_menu_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_social ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for branches
-- Owners can manage branches for their restaurants
CREATE POLICY "Owners can manage own restaurant branches"
  ON branches FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = branches.restaurant_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for active branches
CREATE POLICY "Public can read active branches"
  ON branches FOR SELECT
  USING (is_active = true);

-- 8. RLS Policies for restaurant_tables
-- Owners can manage tables for their restaurant branches
CREATE POLICY "Owners can manage own restaurant tables"
  ON restaurant_tables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM branches
      JOIN restaurants ON restaurants.id = branches.restaurant_id
      WHERE branches.id = restaurant_tables.branch_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for active tables (for menu routing)
CREATE POLICY "Public can read active tables"
  ON restaurant_tables FOR SELECT
  USING (is_active = true);

-- 9. RLS Policies for branch_menu_overrides
-- Owners can manage overrides for their restaurant branches
CREATE POLICY "Owners can manage own branch menu overrides"
  ON branch_menu_overrides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM branches
      JOIN restaurants ON restaurants.id = branches.restaurant_id
      WHERE branches.id = branch_menu_overrides.branch_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for overrides (for menu display)
CREATE POLICY "Public can read branch menu overrides"
  ON branch_menu_overrides FOR SELECT
  USING (true);

-- 10. RLS Policies for branch_social
-- Owners can manage social settings for their restaurant branches
CREATE POLICY "Owners can manage own branch social"
  ON branch_social FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM branches
      JOIN restaurants ON restaurants.id = branches.restaurant_id
      WHERE branches.id = branch_social.branch_id
      AND restaurants.owner_user_id = auth.uid()
    )
  );

-- Public read access for branch social (for menu display)
CREATE POLICY "Public can read branch social"
  ON branch_social FOR SELECT
  USING (true);

-- 11. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_menu_overrides_updated_at
  BEFORE UPDATE ON branch_menu_overrides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_social_updated_at
  BEFORE UPDATE ON branch_social
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

