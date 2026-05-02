-- Idempotent storage setup for product images.
-- Safe to run multiple times.

-- 1) Ensure bucket exists and is public-read.
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- 2) Recreate policies to ensure correct permissions.
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
DROP POLICY IF EXISTS "Product images public read by name" ON storage.objects;
DROP POLICY IF EXISTS "Artisans upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Artisans update own images" ON storage.objects;
DROP POLICY IF EXISTS "Artisans delete own images" ON storage.objects;

-- Public can read images from this bucket.
CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Authenticated artisans can upload only inside their own folder:
-- path format: <auth.uid()>/<filename>
CREATE POLICY "Artisans upload to own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated artisans can update only their own files.
CREATE POLICY "Artisans update own images" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Authenticated artisans can delete only their own files.
CREATE POLICY "Artisans delete own images" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
