import { Queue, ConnectionOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection: ConnectionOptions = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const videoQueue = new Queue('video-generation', { connection });

export const addVideoJob = async (data: any) => {
    await videoQueue.add('generate', data, {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
    });
};
