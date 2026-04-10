import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { generateImage } from './services/imageService.js';
import { generateVoiceover } from './services/voiceService.js';
import { generateBGM } from './services/aceStepService.js';
import { transcribeAudio } from './services/whisperService.js';

dotenv.config();

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// ---------------------------------------------------------------------------
// Image Generation Worker (Seedream 5.0 Lite)
// ---------------------------------------------------------------------------
export const imageWorker = new Worker(
    'image-generation',
    async (job: Job) => {
        const { prompt, width, height, steps, seed } = job.data;
        const result = await generateImage(prompt, { width, height, steps, seed });
        return { imageUrl: result.imageUrl };
    },
    { connection }
);

// ---------------------------------------------------------------------------
// Voice Generation Worker (Qwen3-TTS)
// ---------------------------------------------------------------------------
export const voiceWorker = new Worker(
    'voice-generation',
    async (job: Job) => {
        const { text, voice, language, speed } = job.data;
        const result = await generateVoiceover(text, { voice, language, speed });
        return { audioUrl: result.audioUrl, durationSeconds: result.durationSeconds };
    },
    { connection }
);

// ---------------------------------------------------------------------------
// BGM Generation Worker (ACE-Step 1.5)
// ---------------------------------------------------------------------------
export const bgmWorker = new Worker(
    'bgm-generation',
    async (job: Job) => {
        const { prompt, duration, bpm, genre, mood } = job.data;
        const result = await generateBGM(prompt, { duration, bpm, genre, mood });
        return { audioUrl: result.audioUrl, durationSeconds: result.durationSeconds };
    },
    { connection }
);

// ---------------------------------------------------------------------------
// Captioning Worker (Whisper)
// ---------------------------------------------------------------------------
export const captionWorker = new Worker(
    'captioning',
    async (job: Job) => {
        const { audioUrl, language, fps } = job.data;
        const result = await transcribeAudio(audioUrl, { language, fps });
        return { segments: result.segments, fullText: result.fullText };
    },
    { connection }
);

// ---------------------------------------------------------------------------
// Shared event handlers
// ---------------------------------------------------------------------------
for (const [name, worker] of [
    ['image', imageWorker],
    ['voice', voiceWorker],
    ['bgm', bgmWorker],
    ['caption', captionWorker],
] as const) {
    worker.on('completed', (job) => {
        console.log(`[${name}Worker] Job ${job.id} completed`);
    });
    worker.on('failed', (job, err) => {
        console.error(`[${name}Worker] Job ${job?.id} failed: ${err.message}`);
    });
}

console.log('Asset workers initialized: image (Seedream), voice (Qwen3-TTS), bgm (ACE-Step), caption (Whisper)');
