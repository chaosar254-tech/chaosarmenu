-- Add recommended_sides fields to menu_items table
-- For automatic/manual side recommendations

ALTER TABLE public.menu_items
ADD COLUMN IF NOT EXISTS recommended_sides TEXT NULL,
ADD COLUMN IF NOT EXISTS recommended_sides_auto TEXT NULL,
ADD COLUMN IF NOT EXISTS recommended_sides_source TEXT NOT NULL DEFAULT 'auto' CHECK (recommended_sides_source IN ('auto', 'manual'));

-- Add updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'menu_items' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.menu_items
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    
    -- Create trigger to auto-update updated_at
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

COMMENT ON COLUMN public.menu_items.recommended_sides IS 'Manual side recommendation text (owner override)';
COMMENT ON COLUMN public.menu_items.recommended_sides_auto IS 'Auto-generated side recommendation text (rule engine)';
COMMENT ON COLUMN public.menu_items.recommended_sides_source IS 'Source of recommendation: auto (system) or manual (owner override)';

