import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { addVideoJob } from '../queues/videoQueue.js';

const createVideoSchema = z.object({
    idea: z.string().min(1),
    duration: z.enum(['30s', '60s', '120s']),
    aspectRatio: z.enum(['16:9', '9:16', '1:1']),
    characterId: z.string().optional(),
});

export const videoRoutes = async (fastify: FastifyInstance) => {
    // Submit a video generation job
    fastify.post('/create', async (request: any, reply) => {
        try {
            const body = createVideoSchema.parse(request.body);

            const job = await addVideoJob({
                ...body,
                status: 'CREATED',
                userId: request.user?.id || 'guest',
            });

            return {
                jobId: job.id,
                status: 'CREATED',
                message: 'Video generation job submitted successfully',
            };
        } catch (err) {
            if (err instanceof z.ZodError) {
                return reply.status(400).send({ error: 'Validation failed', details: err.issues });
            }
            throw err;
        }
    });

    // Get job status
    fastify.get('/:id/status', async (request: any) => {
        const { id } = request.params;

        // TODO: Fetch status from Orchestrator/DB
        return {
            jobId: id,
            status: 'PROCESSING',
            progress: 45,
        };
    });

    // Re-render video
    fastify.post('/:id/rerender', async (request: any) => {
        const { id } = request.params;
        return { jobId: id, status: 'QUEUED_FOR_RERENDER' };
    });

    // Publish video
    fastify.post('/:id/publish', async (request: any) => {
        const { id } = request.params;
        return { jobId: id, status: 'PUBLISHED' };
    });
};
