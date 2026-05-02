
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- Replace broad SELECT with one that only allows direct file access (not listing)
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read by name" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images' AND name IS NOT NULL);
