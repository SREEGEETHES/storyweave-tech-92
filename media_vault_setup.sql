-- ==========================================
-- MEDIA VAULT DATABASE SETUP (Sprint 7)
-- ==========================================

-- 1. Create media_assets table for Smart Ingestion
CREATE TABLE IF NOT EXISTS public.media_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    url TEXT NOT NULL,
    type TEXT CHECK (type IN ('image', 'video', 'gif')) NOT NULL,
    ai_description TEXT,
    tags TEXT[] DEFAULT '{}',
    source TEXT CHECK (source IN ('seedream', 'klipy', 'upload', 'remotion')) DEFAULT 'upload',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own media assets"
    ON public.media_assets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media assets"
    ON public.media_assets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media assets"
    ON public.media_assets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media assets"
    ON public.media_assets FOR DELETE
    USING (auth.uid() = user_id);

-- 2. Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_media_assets_fts 
    ON public.media_assets USING gin(to_tsvector('english', COALESCE(ai_description, '') || ' ' || COALESCE(array_to_string(tags, ' '), '')));

-- 3. Create index for tags array search
CREATE INDEX IF NOT EXISTS idx_media_assets_tags 
    ON public.media_assets USING gin(tags);

-- 4. Storage bucket for media vault
INSERT INTO storage.buckets (id, name, public) 
VALUES ('media_vault', 'media_vault', true) 
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Public Access Media Vault" ON storage.objects;
CREATE POLICY "Public Access Media Vault" ON storage.objects FOR SELECT USING (bucket_id = 'media_vault');

DROP POLICY IF EXISTS "Authenticated users can upload Media Vault" ON storage.objects;
CREATE POLICY "Authenticated users can upload Media Vault" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media_vault' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own Media Vault files" ON storage.objects;
CREATE POLICY "Users can delete own Media Vault files" ON storage.objects FOR DELETE USING (bucket_id = 'media_vault' AND auth.uid() = owner);

-- 5. Create render_jobs table for Lambda tracking
CREATE TABLE IF NOT EXISTS public.render_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    video_state JSONB NOT NULL,
    status TEXT CHECK (status IN ('queued', 'processing', 'completed', 'failed')) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    video_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.render_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own render jobs"
    ON public.render_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert render jobs"
    ON public.render_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own render jobs"
    ON public.render_jobs FOR UPDATE
    USING (auth.uid() = user_id);

-- ==========================================
-- END OF MEDIA VAULT SETUP
-- ==========================================