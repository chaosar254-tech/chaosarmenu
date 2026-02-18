-- DEPRECATED: This migration uses old bucket name 'menu-images' (with hyphen)
-- Use migration 007_storage_rls_policies.sql instead which uses 'menu_images' (with underscore)
-- 
-- Storage bucket oluşturma (Supabase Dashboard veya CLI ile yapılmalı)
-- Bu migration sadece RLS policy'lerini ekler
-- Bucket'ı manuel oluştur: menu-images (private)
-- 
-- NOTE: This migration is kept for reference but should NOT be used.
-- The correct bucket name is 'menu_images' (see migration 007).

-- Storage bucket RLS policy'leri
-- Not: Bucket'ı önce Supabase Dashboard'dan oluşturmanız gerekiyor
-- Storage > Buckets > New bucket > Name: "menu-images", Public: false

-- Policy: Restaurant owners can upload images to their folder
CREATE POLICY "Restaurant owners can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Restaurant owners can update their images
CREATE POLICY "Restaurant owners can update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Restaurant owners can delete their images
CREATE POLICY "Restaurant owners can delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'menu-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Public can read images (for signed URLs)
-- Signed URLs will work without this, but we add it for safety
CREATE POLICY "Public can read menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');

