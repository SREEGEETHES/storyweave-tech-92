-- Sprint 6: Social Media Auto-Publishing
-- Creates the social_accounts table for storing OAuth tokens per platform

CREATE TABLE IF NOT EXISTS public.social_accounts (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    platform            TEXT NOT NULL CHECK (platform IN ('tiktok', 'youtube', 'instagram')),
    platform_user_id    TEXT,
    platform_username   TEXT,
    platform_avatar_url TEXT,
    access_token        TEXT NOT NULL,
    refresh_token       TEXT,
    token_expires_at    TIMESTAMPTZ,
    scope               TEXT,
    is_active           BOOLEAN NOT NULL DEFAULT true,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One account per platform per user
    UNIQUE (user_id, platform)
);

-- Keep updated_at in sync automatically
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER social_accounts_updated_at
    BEFORE UPDATE ON public.social_accounts
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: users can only see/manage their own accounts
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own social accounts"
    ON public.social_accounts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social accounts"
    ON public.social_accounts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social accounts"
    ON public.social_accounts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social accounts"
    ON public.social_accounts FOR DELETE
    USING (auth.uid() = user_id);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_social_accounts_user_id ON public.social_accounts (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Extend scheduled_posts table (already exists) with publish_result column
-- so we can store platform-specific post IDs after publishing
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.scheduled_posts
    ADD COLUMN IF NOT EXISTS publish_result  JSONB,
    ADD COLUMN IF NOT EXISTS error_message   TEXT,
    ADD COLUMN IF NOT EXISTS retry_count     INTEGER NOT NULL DEFAULT 0;
