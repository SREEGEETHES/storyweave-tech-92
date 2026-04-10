import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { generateImage } from '../services/imageService.js';
import { generateVoiceover } from '../services/voiceService.js';

dotenv.config();

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// Image Generation Worker
export const imageWorker = new Worker(
    'image-generation',
    async (job: Job) => {
        const { prompt } = job.data;
        const imageUrl = await generateImage(prompt);
        return { imageUrl };
    },
    { connection }
);

// Voice Generation Worker
export const voiceWorker = new Worker(
    'voice-generation',
    async (job: Job) => {
        const { text, voiceId } = job.data;
        const audioUrl = await generateVoiceover(text, voiceId);
        return { audioUrl };
    },
    { connection }
);

console.log('Asset workers initialized...');
