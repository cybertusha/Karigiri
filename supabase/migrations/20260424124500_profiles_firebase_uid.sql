-- Store Firebase users in Supabase profiles table (text uid) + role.
-- This is permissive for ease of development/testing.

-- Drop policies that depend on id type first.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can upsert profiles" ON public.profiles;

-- Remove auth.users FK (Firebase UID is not a uuid from Supabase auth).
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Change id column to text for Firebase UID.
ALTER TABLE public.profiles
  ALTER COLUMN id TYPE text USING id::text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);

-- Add role column if missing.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'customer';

-- Open access (easy mode).
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Anyone can upsert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update profiles" ON public.profiles
  FOR UPDATE USING (true) WITH CHECK (true);
