import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
    createRenderJob,
    getRenderJob,
    getRenderJobByLambdaId,
    getUserRenderJobs,
    updateRenderJob,
} from '../db/renderJobs.js';
import {
    triggerLambdaRender,
    getLambdaRenderProgress,
} from '../services/lambdaRender.js';
import { getUploadPresignedUrl, getDownloadPresignedUrl } from '../services/s3Service.js';
import { videoStateSchema } from '../types/videoState.js';

// ---------------------------------------------------------------------------
// Webhook body schema (Remotion Lambda webhook)
// ---------------------------------------------------------------------------

const webhookBodySchema = z.object({
    type: z.enum(['success', 'error', 'timeout']),
    renderId: z.string(),
    expectedBucketOwner: z.string().optional(),
    outputFile: z.string().optional(),
    errors: z.array(z.object({ message: z.string() })).optional(),
});

// ---------------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------------

export const renderRoutes = async (fastify: FastifyInstance) => {

    // =========================================================================
    // POST /render
    // Submit a VideoState → queue a Remotion Lambda render job
    // =========================================================================
    fastify.post('/', async (request: any, reply) => {
        let body: z.infer<typeof videoStateSchema>;

        try {
            body = videoStateSchema.parse(request.body);
        } catch (err) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Invalid VideoState', details: err.issues });
            }
            throw err;
        }

        const jobId = randomUUID();
        const userId: string = request.user?.id ?? 'guest';

        // 1. Persist the job in Neon Postgres immediately (status = QUEUED)
        await createRenderJob({ id: jobId, userId, videoState: body as any });

        // 2. Fire off the Lambda render
        let lambdaResult;
        try {
            lambdaResult = await triggerLambdaRender(jobId, body);
        } catch (err: any) {
            await updateRenderJob(jobId, {
                status: 'FAILED',
                error_message: err.message ?? 'Failed to trigger Lambda render',
            });
            fastify.log.error(err);
            return reply.status(500).send({ error: err.message ?? 'Failed to trigger Lambda render' });
        }

        // 3. Store the Lambda renderId for progress polling
        await updateRenderJob(jobId, {
            status: 'RENDERING',
            lambda_render_id: lambdaResult.renderId,
            s3_output_key: lambdaResult.outputKey,
        });

        return reply.status(202).send({
            jobId,
            renderId: lambdaResult.renderId,
            bucketName: lambdaResult.bucketName,
            status: 'RENDERING',
        });
    });

    // =========================================================================
    // GET /render/:jobId/progress
    // Poll the live Lambda render progress for a job
    // =========================================================================
    fastify.get('/:jobId/progress', async (request: any, reply) => {
        const { jobId } = request.params as { jobId: string };

        const job = await getRenderJob(jobId);
        if (!job) return reply.status(404).send({ error: 'Render job not found' });

        // Short-circuit for terminal states already cached in DB
        if (job.status === 'COMPLETED') {
            return {
                jobId,
                status: 'COMPLETED',
                progress: 100,
                outputUrl: job.output_url,
            };
        }

        if (job.status === 'FAILED') {
            return {
                jobId,
                status: 'FAILED',
                progress: job.progress,
                error: job.error_message,
            };
        }

        // Live-poll Lambda
        if (job.lambda_render_id) {
            try {
                const { overallProgress, done, outputFile, errors } =
                    await getLambdaRenderProgress(
                        job.lambda_render_id,
                        process.env.S3_BUCKET_NAME ?? 'storyweave-renders'
                    );

                if (errors.length > 0) {
                    await updateRenderJob(jobId, {
                        status: 'FAILED',
                        error_message: errors[0],
                        progress: overallProgress,
                    });
                    return { jobId, status: 'FAILED', progress: overallProgress, error: errors[0] };
                }

                if (done && outputFile) {
                    // Generate a 1-hour pre-signed download link
                    const outputKey = job.s3_output_key ?? `renders/${jobId}.mp4`;
                    const outputUrl = await getDownloadPresignedUrl(outputKey);
                    await updateRenderJob(jobId, {
                        status: 'COMPLETED',
                        progress: 100,
                        output_url: outputFile,   // store the raw S3 URL
                    });
                    return { jobId, status: 'COMPLETED', progress: 100, outputUrl };
                }

                // In-progress — update DB and return latest %
                await updateRenderJob(jobId, { progress: overallProgress });
                return { jobId, status: 'RENDERING', progress: overallProgress };

            } catch (err: any) {
                fastify.log.error({ err }, 'Lambda progress poll failed');
                // Return last known state from DB rather than crashing
                return { jobId, status: job.status, progress: job.progress };
            }
        }

        return { jobId, status: job.status, progress: job.progress };
    });

    // =========================================================================
    // POST /render/webhook
    // Remotion Lambda calls this URL when a render finishes or errors.
    // Set RENDER_WEBHOOK_URL=https://your-api.domain/render/webhook
    // =========================================================================
    fastify.post('/webhook', async (request: any, reply) => {
        // Validate optional shared secret
        const incomingSecret = request.headers['x-remotion-webhook-secret'];
        const configuredSecret = process.env.RENDER_WEBHOOK_SECRET;
        if (configuredSecret && incomingSecret !== configuredSecret) {
            return reply.status(401).send({ error: 'Invalid webhook secret' });
        }

        let body: z.infer<typeof webhookBodySchema>;
        try {
            body = webhookBodySchema.parse(request.body);
        } catch {
            return reply.status(400).send({ error: 'Malformed webhook body' });
        }

        const job = await getRenderJobByLambdaId(body.renderId);
        if (!job) {
            // Unknown render — ignore gracefully (could be from a different env)
            fastify.log.warn({ renderId: body.renderId }, 'Webhook: no matching render job');
            return reply.status(200).send({ ok: true });
        }

        if (body.type === 'success' && body.outputFile) {
            const outputUrl = await getDownloadPresignedUrl(
                job.s3_output_key ?? `renders/${job.id}.mp4`
            );
            await updateRenderJob(job.id, {
                status: 'COMPLETED',
                progress: 100,
                output_url: body.outputFile,
            });
            fastify.log.info({ jobId: job.id, outputFile: body.outputFile }, 'Render complete via webhook');

        } else if (body.type === 'error' || body.type === 'timeout') {
            const errMsg =
                body.errors?.[0]?.message ??
                (body.type === 'timeout' ? 'Lambda render timed out' : 'Lambda render failed');
            await updateRenderJob(job.id, {
                status: 'FAILED',
                error_message: errMsg,
            });
            fastify.log.error({ jobId: job.id, errMsg }, 'Render failed via webhook');
        }

        return reply.status(200).send({ ok: true });
    });

    // =========================================================================
    // GET /render/presign
    // Returns a pre-signed S3 PUT URL for direct browser → S3 asset uploads
    //
    // Query params:
    //   fileName    - original file name (used to construct S3 key)
    //   contentType - MIME type of the file
    // =========================================================================
    fastify.get('/presign', async (request: any, reply) => {
        const { fileName, contentType } = request.query as Record<string, string | undefined>;

        if (!fileName || !contentType) {
            return reply.status(400).send({ error: 'fileName and contentType query params are required' });
        }

        const userId: string = request.user?.id ?? 'guest';
        const key = `uploads/${userId}/${Date.now()}_${encodeURIComponent(fileName)}`;

        const { uploadUrl, publicUrl } = await getUploadPresignedUrl(key, contentType);
        return { uploadUrl, key, publicUrl };
    });

    // =========================================================================
    // GET /render/jobs
    // List all render jobs for the authenticated user
    // =========================================================================
    fastify.get('/jobs', async (request: any) => {
        const userId: string = request.user?.id ?? 'guest';
        const jobs = await getUserRenderJobs(userId);
        return {
            jobs: jobs.map(j => ({
                jobId: j.id,
                status: j.status,
                progress: j.progress,
                outputUrl: j.output_url,
                createdAt: j.created_at,
            })),
        };
    });
};
