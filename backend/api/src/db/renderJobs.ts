import { sql } from './neon.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RenderStatus =
    | 'QUEUED'
    | 'RENDERING'
    | 'UPLOADING'
    | 'COMPLETED'
    | 'FAILED';

export interface RenderJob {
    id: string;
    user_id: string;
    status: RenderStatus;
    progress: number;
    video_state: Record<string, unknown>;
    lambda_render_id: string | null;
    s3_output_key: string | null;
    output_url: string | null;
    error_message: string | null;
    created_at: string;
    updated_at: string;
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

export const createRenderJob = async (data: {
    id: string;
    userId: string;
    videoState: Record<string, unknown>;
}): Promise<RenderJob> => {
    const rows = await sql`
        INSERT INTO render_jobs (id, user_id, status, progress, video_state)
        VALUES (
            ${data.id},
            ${data.userId},
            'QUEUED',
            0,
            ${JSON.stringify(data.videoState)}
        )
        RETURNING *
    `;
    return rows[0] as RenderJob;
};

export const getRenderJob = async (id: string): Promise<RenderJob | null> => {
    const rows = await sql`
        SELECT * FROM render_jobs WHERE id = ${id}
    `;
    return rows.length > 0 ? (rows[0] as RenderJob) : null;
};

export const updateRenderJob = async (
    id: string,
    updates: Partial<
        Pick<
            RenderJob,
            | 'status'
            | 'progress'
            | 's3_output_key'
            | 'output_url'
            | 'error_message'
            | 'lambda_render_id'
        >
    >
): Promise<void> => {
    // COALESCE preserves the existing column value when the parameter is NULL,
    // allowing partial updates without overwriting fields we did not touch.
    await sql`
        UPDATE render_jobs
        SET
            status            = COALESCE(${updates.status           ?? null}, status),
            progress          = COALESCE(${updates.progress         ?? null}, progress),
            s3_output_key     = COALESCE(${updates.s3_output_key    ?? null}, s3_output_key),
            output_url        = COALESCE(${updates.output_url       ?? null}, output_url),
            error_message     = COALESCE(${updates.error_message    ?? null}, error_message),
            lambda_render_id  = COALESCE(${updates.lambda_render_id ?? null}, lambda_render_id),
            updated_at        = NOW()
        WHERE id = ${id}
    `;
};

export const getRenderJobByLambdaId = async (lambdaRenderId: string): Promise<RenderJob | null> => {
    const rows = await sql`
        SELECT * FROM render_jobs WHERE lambda_render_id = ${lambdaRenderId}
    `;
    return rows.length > 0 ? (rows[0] as RenderJob) : null;
};

export const getUserRenderJobs = async (userId: string): Promise<RenderJob[]> => {
    const rows = await sql`
        SELECT * FROM render_jobs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
    `;
    return rows as RenderJob[];
};
