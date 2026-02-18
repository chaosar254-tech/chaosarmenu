-- Storage RLS policies for menu_images bucket
-- Multi-tenant: restaurant owners can only access their own folder
-- Path convention: {restaurant.id}/items/{menuItemId}/{uuid}.{ext}
--
-- IMPORTANT: Create the bucket first in Supabase Dashboard:
-- Storage > Buckets > New bucket
-- Name: menu_images
-- Public: false (private bucket)

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Restaurant owners can INSERT images to their restaurant folder
CREATE POLICY "Restaurant owners can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu_images' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND (storage.objects.name LIKE (r.id::text || '/%'))
  )
);

-- Policy: Restaurant owners can SELECT (read) images from their restaurant folder
CREATE POLICY "Restaurant owners can read their images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'menu_images' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND (storage.objects.name LIKE (r.id::text || '/%'))
  )
);

-- Policy: Restaurant owners can UPDATE images in their restaurant folder
CREATE POLICY "Restaurant owners can update their images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu_images' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND (storage.objects.name LIKE (r.id::text || '/%'))
  )
);

-- Policy: Restaurant owners can DELETE images from their restaurant folder
CREATE POLICY "Restaurant owners can delete their images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu_images' AND
  EXISTS (
    SELECT 1
    FROM public.restaurants r
    WHERE r.owner_user_id = auth.uid()
    AND (storage.objects.name LIKE (r.id::text || '/%'))
  )
);

-- Note: Public menu will use signed URLs via service role key (server-side only)
-- No public SELECT policy needed for anonymous users

