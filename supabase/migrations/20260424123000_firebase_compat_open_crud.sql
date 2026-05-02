-- Firebase compatibility + permissive CRUD policies.
-- This intentionally opens access for easier development/testing.
-- Run in Supabase SQL editor or via migration tooling.

-- 1) Drop dependent policies first (required before ALTER COLUMN type).
DROP POLICY IF EXISTS "Published products viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Artisans can insert own products" ON public.products;
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Artisans can update own products" ON public.products;
DROP POLICY IF EXISTS "Artisans can delete own products" ON public.products;
DROP POLICY IF EXISTS "Anyone can read products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;

DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;

-- 2) Make ID columns compatible with Firebase UID strings.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_artisan_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

ALTER TABLE public.products
  ALTER COLUMN artisan_id TYPE text USING artisan_id::text;

ALTER TABLE public.orders
  ALTER COLUMN customer_id TYPE text USING customer_id::text;

-- 3) Open CRUD on products for everyone.
CREATE POLICY "Anyone can read products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert products" ON public.products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update products" ON public.products
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete products" ON public.products
  FOR DELETE USING (true);

-- 4) Open CRUD on orders for everyone.
CREATE POLICY "Anyone can read orders" ON public.orders
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert orders" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update orders" ON public.orders
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can delete orders" ON public.orders
  FOR DELETE USING (true);

-- 5) Open storage object access for product-images bucket.
DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
DROP POLICY IF EXISTS "Artisans upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users upload to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Artisans update own images" ON storage.objects;
DROP POLICY IF EXISTS "Artisans delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read product-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can insert product-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product-images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product-images" ON storage.objects;

CREATE POLICY "Anyone can read product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Anyone can insert product-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can update product-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Anyone can delete product-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images');
