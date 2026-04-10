import { Queue, ConnectionOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection: ConnectionOptions = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const imageQueue = new Queue('image-generation', { connection });
export const voiceQueue = new Queue('voice-generation', { connection });

export const addImageJob = async (data: any) => {
    return await imageQueue.add('generate-image', data);
};

export const addVoiceJob = async (data: any) => {
    return await voiceQueue.add('generate-voice', data);
};
