-- 039: Create menu_subcategories table and link to menu_items
-- - Adds branch-scoped subcategories under menu_categories
-- - Links menu_items optionally to a subcategory
-- - Adds RLS policies aligned with existing menu_items/menu_categories rules

-- Create menu_subcategories table
CREATE TABLE IF NOT EXISTS public.menu_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for filtering
CREATE INDEX IF NOT EXISTS idx_menu_subcategories_branch
  ON public.menu_subcategories(branch_id);

CREATE INDEX IF NOT EXISTS idx_menu_subcategories_branch_category
  ON public.menu_subcategories(branch_id, category_id);

-- Link menu_items to subcategories (optional)
ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.menu_subcategories(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_menu_items_subcategory
  ON public.menu_items(subcategory_id);

-- Ensure subcategory belongs to same branch as category
CREATE OR REPLACE FUNCTION public.validate_subcategory_branch()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.menu_categories c
    WHERE c.id = NEW.category_id
      AND c.branch_id = NEW.branch_id
  ) THEN
    RAISE EXCEPTION 'Subcategory % category % does not belong to branch %',
      NEW.id, NEW.category_id, NEW.branch_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_menu_subcategory_branch ON public.menu_subcategories;

CREATE TRIGGER validate_menu_subcategory_branch
BEFORE INSERT OR UPDATE ON public.menu_subcategories
FOR EACH ROW
EXECUTE FUNCTION public.validate_subcategory_branch();

-- Ensure any assigned subcategory on menu_items belongs to same branch and category (when set)
CREATE OR REPLACE FUNCTION public.validate_menu_item_subcategory()
RETURNS TRIGGER AS $$
DECLARE
  sub_branch UUID;
  sub_category UUID;
BEGIN
  IF NEW.subcategory_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT branch_id, category_id
  INTO sub_branch, sub_category
  FROM public.menu_subcategories
  WHERE id = NEW.subcategory_id;

  IF sub_branch IS NULL THEN
    RAISE EXCEPTION 'Subcategory % not found', NEW.subcategory_id;
  END IF;

  IF sub_branch <> NEW.branch_id THEN
    RAISE EXCEPTION 'Subcategory % does not belong to branch %', NEW.subcategory_id, NEW.branch_id;
  END IF;

  -- If category_id is set, enforce match between item.category_id and subcategory.category_id
  IF NEW.category_id IS NOT NULL AND sub_category IS NOT NULL AND NEW.category_id <> sub_category THEN
    RAISE EXCEPTION 'Subcategory % does not belong to category %', NEW.subcategory_id, NEW.category_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_menu_item_subcategory ON public.menu_items;

CREATE TRIGGER validate_menu_item_subcategory
BEFORE INSERT OR UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.validate_menu_item_subcategory();

-- RLS policies for menu_subcategories
DO $$
BEGIN
  -- Drop old policies if they exist (idempotent)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_subcategories'
      AND policyname = 'Owners can manage subcategories for own restaurant branches'
  ) THEN
    DROP POLICY "Owners can manage subcategories for own restaurant branches" ON public.menu_subcategories;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'menu_subcategories'
      AND policyname = 'Public can read active subcategories'
  ) THEN
    DROP POLICY "Public can read active subcategories" ON public.menu_subcategories;
  END IF;
END $$;

-- Owners can manage subcategories for branches of their restaurants
CREATE POLICY "Owners can manage subcategories for own restaurant branches"
  ON public.menu_subcategories FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.branches b
      JOIN public.restaurants r ON r.id = b.restaurant_id
      WHERE b.id = menu_subcategories.branch_id
        AND r.owner_user_id = auth.uid()
    )
  );

-- Public can read active subcategories (for menu display)
CREATE POLICY "Public can read active subcategories"
  ON public.menu_subcategories FOR SELECT
  USING (is_active = true);

-- Documentation comments
COMMENT ON TABLE public.menu_subcategories IS 'Branch-scoped menu subcategories under menu_categories';
COMMENT ON COLUMN public.menu_subcategories.branch_id IS 'Branch this subcategory belongs to';
COMMENT ON COLUMN public.menu_subcategories.category_id IS 'Parent menu category';
COMMENT ON COLUMN public.menu_items.subcategory_id IS 'Optional subcategory for this menu item';

