
-- Roles enum + user_roles table
CREATE TYPE public.app_role AS ENUM ('admin', 'artisan', 'customer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  avatar_url text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role app_role;
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));

  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'::app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Craft types enum
CREATE TYPE public.craft_type AS ENUM (
  'pottery','textiles','jewelry','woodwork','metalwork','painting','leather','glasswork','basketry','stonework','other'
);

-- Products table
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  state text NOT NULL,
  craft craft_type NOT NULL,
  images text[] NOT NULL DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_state ON public.products(state);
CREATE INDEX idx_products_craft ON public.products(craft);
CREATE INDEX idx_products_price ON public.products(price);
CREATE INDEX idx_products_artisan ON public.products(artisan_id);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published products viewable by everyone" ON public.products
  FOR SELECT USING (is_published = true OR artisan_id = auth.uid());
CREATE POLICY "Artisans can insert own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = artisan_id AND public.has_role(auth.uid(), 'artisan'));
CREATE POLICY "Artisans can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = artisan_id);
CREATE POLICY "Artisans can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = artisan_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Orders (basic structure)
CREATE TYPE public.order_status AS ENUM ('pending','paid','shipped','delivered','cancelled');

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity int NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total numeric(10,2) NOT NULL CHECK (total >= 0),
  status order_status NOT NULL DEFAULT 'pending',
  shipping_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_product ON public.orders(product_id);

CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = customer_id OR EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.artisan_id = auth.uid()));
CREATE POLICY "Customers insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images','product-images',true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Artisans upload to own folder" ON storage.objects;
CREATE POLICY "Artisans upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND public.has_role(auth.uid(), 'artisan')
  );
DROP POLICY IF EXISTS "Artisans update own images" ON storage.objects;
CREATE POLICY "Artisans update own images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "Artisans delete own images" ON storage.objects;
CREATE POLICY "Artisans delete own images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
