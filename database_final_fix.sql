-- ==========================================
-- CONSOLIDATED DATABASE FIX & SETUP
-- ==========================================

-- 1. Create profiles table (Essential for Dashboard)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'Free',
  credits INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- 2. Trigger for Automatic Profile Creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, plan)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(new.raw_user_meta_data->>'plan', 'Free')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Fix characters table schema
-- Add missing columns or ensure they exist to match code
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS image_url TEXT; 
-- (Note: 'generated_images' and 'reference_image_path' already exist)

-- 4. Ensure generations table is robust
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 5. Fix RLS for all tables (Ensure they are enabled and have policies)
DO $$
BEGIN
    -- generations policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generations' AND policyname = 'Users can view own generations') THEN
        CREATE POLICY "Users can view own generations" ON public.generations FOR SELECT USING (auth.uid() = user_id);
    END IF;
    -- (Add others if needed, but assuming migrations handle most)
END $$;

-- 6. Storage Buckets Final Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true) ON CONFLICT (id) DO NOTHING;

-- Policies for Thumbnails
DROP POLICY IF EXISTS "Public Access Thumbnails" ON storage.objects;
CREATE POLICY "Public Access Thumbnails" ON storage.objects FOR SELECT USING ( bucket_id = 'thumbnails' );
DROP POLICY IF EXISTS "Authenticated users can upload Thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload Thumbnails" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'thumbnails' AND auth.role() = 'authenticated' );

-- Policies for Assets
DROP POLICY IF EXISTS "Public Access Assets" ON storage.objects;
CREATE POLICY "Public Access Assets" ON storage.objects FOR SELECT USING ( bucket_id = 'assets' );
DROP POLICY IF EXISTS "Authenticated users can upload Assets" ON storage.objects;
CREATE POLICY "Authenticated users can upload Assets" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'assets' AND auth.role() = 'authenticated' );

-- ==========================================
-- END OF CONSOLIDATED FIX
-- ==========================================
