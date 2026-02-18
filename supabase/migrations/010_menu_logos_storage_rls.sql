-- Storage RLS policies for menu_logos bucket
-- Multi-tenant: restaurant owners can only access their own logos
-- Path convention: logos/{restaurant.id}/{uuid}.{ext}
--
-- IMPORTANT: Create the bucket first in Supabase Dashboard:
-- Storage > Buckets > New bucket
-- Name: menu_logos
-- Public: false (private bucket)

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for migration)
DROP POLICY IF EXISTS "Restaurant owners can upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can read their logos" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can update their logos" ON storage.objects;
DROP POLICY IF EXISTS "Restaurant owners can delete their logos" ON storage.objects;

-- Policy: Restaurant owners can INSERT logos to their restaurant folder
-- Path format: logos/{restaurantId}/{uuid}.{ext}
-- Extract restaurantId from second path segment: split_part(name, '/', 2)
CREATE POLICY "Restaurant owners can upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu_logos' AND
  split_part(name, '/', 1) = 'logos' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND r.id::text = split_part(storage.objects.name, '/', 2)
  )
);

-- Policy: Restaurant owners can SELECT (read) their own logos
CREATE POLICY "Restaurant owners can read their logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'menu_logos' AND
  split_part(name, '/', 1) = 'logos' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND r.id::text = split_part(storage.objects.name, '/', 2)
  )
);

-- Policy: Restaurant owners can UPDATE their logos
CREATE POLICY "Restaurant owners can update their logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu_logos' AND
  split_part(name, '/', 1) = 'logos' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND r.id::text = split_part(storage.objects.name, '/', 2)
  )
);

-- Policy: Restaurant owners can DELETE their logos
CREATE POLICY "Restaurant owners can delete their logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu_logos' AND
  split_part(name, '/', 1) = 'logos' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND r.id::text = split_part(storage.objects.name, '/', 2)
  )
);

-- Note: Public menu will use signed URLs via service role key (server-side only)
-- No public SELECT policy needed for anonymous users

