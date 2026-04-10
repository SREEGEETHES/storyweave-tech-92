import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { videoRoutes } from './routes/video.js';
import { renderRoutes } from './routes/render.js';
import { socialRoutes } from './routes/social.js';

dotenv.config();

const fastify = Fastify({
    logger: true,
});

// Register plugins
fastify.register(cors, {
    origin: true, // Allow all origins for dev
});

fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
});

// Decorate fastify for auth
fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

// Register routes
fastify.register(videoRoutes, { prefix: '/video' });
fastify.register(renderRoutes, { prefix: '/render' });
fastify.register(socialRoutes, { prefix: '/social' });

// Health check
fastify.get('/health', async () => {
    return { status: 'ok' };
});

const start = async () => {
    try {
        const port = parseInt(process.env.PORT || '3001');
        await fastify.listen({ port, host: '0.0.0.0' });
        console.log(`Server listening on port ${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
