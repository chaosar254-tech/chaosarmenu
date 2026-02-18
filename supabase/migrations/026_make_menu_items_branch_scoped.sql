-- Migration 026: Make menu items and categories branch-scoped
-- This migration:
-- 1. Adds branch_id to menu_items and menu_categories
-- 2. Migrates existing data to default branches (one per restaurant)
-- 3. Makes branch_id required (after migration)
-- 4. Updates indexes and RLS policies
-- 5. Handles recommended_item_ids mapping when cloning

-- Step 1: Add branch_id columns (nullable initially for migration)
ALTER TABLE menu_categories
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

ALTER TABLE menu_items
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE CASCADE;

-- Step 2: Create indexes for branch_id (before making it required)
CREATE INDEX IF NOT EXISTS idx_menu_categories_branch_id ON menu_categories(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_id ON menu_items(branch_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_branch_category ON menu_items(branch_id, category_id);

-- Step 3: Migrate existing data to default branches
-- For each restaurant, find or create a default branch and assign all menu data to it
DO $$
DECLARE
  r RECORD;
  default_branch_id UUID;
  category_mapping RECORD;
  old_category_id UUID;
  new_category_id UUID;
  category_map UUID[];
  item_mapping RECORD;
  old_item_id UUID;
  new_item_id UUID;
  item_map UUID[];
BEGIN
  -- Loop through each restaurant
  FOR r IN 
    SELECT DISTINCT id as restaurant_id
    FROM restaurants
  LOOP
    -- Find or create default branch for this restaurant
    SELECT id INTO default_branch_id
    FROM branches
    WHERE restaurant_id = r.restaurant_id
    AND slug = 'ana-sub' -- Default branch slug
    LIMIT 1;
    
    -- If no default branch exists, create one
    IF default_branch_id IS NULL THEN
      INSERT INTO branches (restaurant_id, name, slug, is_active)
      VALUES (r.restaurant_id, 'Ana Şube', 'ana-sub', true)
      ON CONFLICT (restaurant_id, slug) DO NOTHING
      RETURNING id INTO default_branch_id;
      
      -- If still null (conflict), try to get it again
      IF default_branch_id IS NULL THEN
        SELECT id INTO default_branch_id
        FROM branches
        WHERE restaurant_id = r.restaurant_id
        AND slug = 'ana-sub'
        LIMIT 1;
      END IF;
    END IF;
    
    -- If we still don't have a branch, create a generic one
    IF default_branch_id IS NULL THEN
      INSERT INTO branches (restaurant_id, name, slug, is_active)
      VALUES (r.restaurant_id, 'Ana Şube', 'ana-sub-' || substring(r.restaurant_id::text, 1, 8), true)
      RETURNING id INTO default_branch_id;
    END IF;
    
    -- Migrate categories: assign to default branch (must happen first)
    UPDATE menu_categories
    SET branch_id = default_branch_id
    WHERE restaurant_id = r.restaurant_id
    AND branch_id IS NULL;
    
    -- Migrate menu items: assign to default branch
    -- Category references remain valid since categories were just assigned to same branch
    UPDATE menu_items
    SET branch_id = default_branch_id
    WHERE restaurant_id = r.restaurant_id
    AND branch_id IS NULL;
  END LOOP;
  
  -- Step 4: Fix recommended_item_ids to reference items within the same branch
  -- After migration, all items in a branch should already reference items in same branch
  -- But we'll clean up any invalid references just in case
  UPDATE menu_items
  SET recommended_item_ids = (
    SELECT CASE 
      WHEN array_agg(item_id) = ARRAY[]::uuid[] THEN NULL
      ELSE array_agg(item_id)
    END
    FROM unnest(COALESCE(recommended_item_ids, ARRAY[]::uuid[])) AS item_id
    WHERE EXISTS (
      SELECT 1 FROM menu_items mi2
      WHERE mi2.id = item_id
      AND mi2.branch_id = menu_items.branch_id
    )
  )
  WHERE recommended_item_ids IS NOT NULL
  AND array_length(recommended_item_ids, 1) > 0;
END $$;

-- Step 5: Make branch_id required (NOT NULL)
ALTER TABLE menu_categories
ALTER COLUMN branch_id SET NOT NULL;

ALTER TABLE menu_items
ALTER COLUMN branch_id SET NOT NULL;

-- Step 6: Drop old restaurant_id index on menu_items (keep restaurant_id for backward compatibility, but queries use branch_id)
-- Actually, keep restaurant_id for now since we might need it for cross-branch queries or restaurant-level analytics
-- But add composite index for branch_id + restaurant_id

-- Step 7: Update foreign key constraint - keep simple FK to categories
-- We'll validate branch matching via trigger (see Step 8)
-- The existing FK should already exist, but let's ensure it's correct
DO $$
BEGIN
  -- Drop existing FK if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'menu_items_category_id_fkey'
    AND table_name = 'menu_items'
  ) THEN
    ALTER TABLE menu_items DROP CONSTRAINT menu_items_category_id_fkey;
  END IF;
  
  -- Add FK constraint
  ALTER TABLE menu_items
  ADD CONSTRAINT menu_items_category_id_fkey
  FOREIGN KEY (category_id)
  REFERENCES menu_categories(id)
  ON DELETE CASCADE;
END $$;

-- Add trigger function to ensure category belongs to same branch as item
CREATE OR REPLACE FUNCTION validate_category_branch()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM menu_categories
    WHERE id = NEW.category_id
    AND branch_id = NEW.branch_id
  ) THEN
    RAISE EXCEPTION 'Category % does not belong to branch %', NEW.category_id, NEW.branch_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_menu_item_category_branch
BEFORE INSERT OR UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION validate_category_branch();

-- Step 8: Drop branch_menu_overrides table (no longer needed - items are branch-scoped)
DROP TABLE IF EXISTS branch_menu_overrides CASCADE;

-- Step 9: Update RLS policies for branch-scoped access
-- Drop old policies
DROP POLICY IF EXISTS "Owners can manage own restaurant categories" ON menu_categories;
DROP POLICY IF EXISTS "Public can read active categories" ON menu_categories;
DROP POLICY IF EXISTS "Owners can manage own restaurant items" ON menu_items;
DROP POLICY IF EXISTS "Public can read active items" ON menu_items;

-- New RLS policies for branch-scoped access
-- Owners can manage categories for branches of their restaurants
CREATE POLICY "Owners can manage categories for own restaurant branches"
  ON menu_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM branches b
      JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.id = menu_categories.branch_id
      AND r.owner_user_id = auth.uid()
    )
  );

-- Public can read active categories (for menu display)
CREATE POLICY "Public can read active categories"
  ON menu_categories FOR SELECT
  USING (is_active = true);

-- Owners can manage items for branches of their restaurants
CREATE POLICY "Owners can manage items for own restaurant branches"
  ON menu_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM branches b
      JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.id = menu_items.branch_id
      AND r.owner_user_id = auth.uid()
    )
  );

-- Public can read active items (for menu display)
CREATE POLICY "Public can read active items"
  ON menu_items FOR SELECT
  USING (is_active = true);

-- Step 10: Add comments
COMMENT ON COLUMN menu_categories.branch_id IS 'Branch this category belongs to. Categories are now branch-scoped.';
COMMENT ON COLUMN menu_items.branch_id IS 'Branch this menu item belongs to. Menu items are now branch-scoped. Items are independent per branch after initial clone.';

