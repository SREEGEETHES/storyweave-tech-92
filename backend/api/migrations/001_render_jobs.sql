-- ============================================================
-- Migration: 001_render_jobs
-- Creates the render_jobs table for tracking Remotion Lambda
-- render jobs.  Apply once against the Neon (Postgres) DB.
-- ============================================================

CREATE TABLE IF NOT EXISTS render_jobs (
    id                  TEXT        PRIMARY KEY,
    user_id             TEXT        NOT NULL,
    status              TEXT        NOT NULL DEFAULT 'QUEUED',
    progress            INTEGER     NOT NULL DEFAULT 0,
    video_state         JSONB       NOT NULL,
    lambda_render_id    TEXT,
    s3_output_key       TEXT,
    output_url          TEXT,
    error_message       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for common query patterns
CREATE INDEX IF NOT EXISTS idx_render_jobs_user_id         ON render_jobs (user_id);
CREATE INDEX IF NOT EXISTS idx_render_jobs_status          ON render_jobs (status);
CREATE INDEX IF NOT EXISTS idx_render_jobs_lambda_render_id ON render_jobs (lambda_render_id);

-- Automatically keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_render_jobs_updated_at ON render_jobs;
CREATE TRIGGER trg_render_jobs_updated_at
    BEFORE UPDATE ON render_jobs
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
