-- Add progress tracking columns to generations table
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS status_message TEXT DEFAULT 'Initializing...',
ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_generations_progress ON public.generations(progress_percent);