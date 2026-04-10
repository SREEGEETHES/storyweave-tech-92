-- Migration to add thumbnail support
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Create 'thumbnails' storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Security policies for 'thumbnails'
DROP POLICY IF EXISTS "Public Access Thumbnails" ON storage.objects;
CREATE POLICY "Public Access Thumbnails"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'thumbnails' );

DROP POLICY IF EXISTS "Authenticated users can upload Thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload Thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'thumbnails' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their own thumbnails" ON storage.objects;
CREATE POLICY "Users can update their own thumbnails"
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'thumbnails' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete their own thumbnails" ON storage.objects;
CREATE POLICY "Users can delete their own thumbnails"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'thumbnails' AND auth.uid() = owner );
