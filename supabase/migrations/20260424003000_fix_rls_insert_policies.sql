-- Fix RLS insert errors for existing projects.
-- Safe to run multiple times.

-- PRODUCTS: allow authenticated user to insert their own product rows.
DROP POLICY IF EXISTS "Artisans can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;

CREATE POLICY "Users can insert own products" ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = artisan_id);

-- STORAGE: allow authenticated user to upload only into their own folder.
DROP POLICY IF EXISTS "Artisans upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;

CREATE POLICY "Users upload to own folder" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
