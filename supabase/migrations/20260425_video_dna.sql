-- Create video_dna table for storing extracted YouTube DNA
CREATE TABLE IF NOT EXISTS public.video_dna (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Source content
    source_url TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('youtube', 'upload', 'url')),
    title TEXT,
    
    -- DNA content (Kimi K2.5 analysis)
    dna JSONB,
    frame_count INTEGER DEFAULT 5,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_dna_user_id ON public.video_dna(user_id);
CREATE INDEX IF NOT EXISTS idx_video_dna_source_type ON public.video_dna(source_type);
CREATE INDEX IF NOT EXISTS idx_video_dna_created_at ON public.video_dna(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.video_dna ENABLE ROW LEVEL SECURITY;

-- Policy
CREATE POLICY "Users can view own video_dna"
    ON public.video_dna
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video_dna"
    ON public.video_dna
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video_dna"
    ON public.video_dna
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video_dna"
    ON public.video_dna
    FOR DELETE
    USING (auth.uid() = user_id);

GRANT ALL ON public.video_dna TO authenticated;
GRANT ALL ON public.video_dna TO service_role;