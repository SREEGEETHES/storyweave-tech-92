import { Queue, ConnectionOptions } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

const connection: ConnectionOptions = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

// ---------------------------------------------------------------------------
// Queues (consumed by backend/workers)
// ---------------------------------------------------------------------------
export const imageQueue = new Queue('image-generation', { connection });
export const voiceQueue = new Queue('voice-generation', { connection });
export const bgmQueue   = new Queue('bgm-generation',   { connection });
export const captionQueue = new Queue('captioning',      { connection });

// ---------------------------------------------------------------------------
// Typed job helpers
// ---------------------------------------------------------------------------

export interface ImageJobData {
    prompt: string;
    jobId: string;
    sceneIndex: number;
    width?: number;
    height?: number;
    steps?: number;
    seed?: number;
}

export interface VoiceJobData {
    text: string;
    jobId: string;
    sceneIndex: number;
    voice?: string;
    language?: string;
    speed?: number;
}

export interface BGMJobData {
    prompt: string;
    jobId: string;
    duration: number;
    bpm?: number;
    genre?: string;
    mood?: string;
}

export interface CaptionJobData {
    audioUrl: string;
    jobId: string;
    language?: string;
    fps?: number;
}

export const addImageJob = (name: string, data: ImageJobData) =>
    imageQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

export const addVoiceJob = (name: string, data: VoiceJobData) =>
    voiceQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });

export const addBGMJob = (name: string, data: BGMJobData) =>
    bgmQueue.add(name, data, { attempts: 2, backoff: { type: 'exponential', delay: 10_000 } });

export const addCaptionJob = (name: string, data: CaptionJobData) =>
    captionQueue.add(name, data, { attempts: 3, backoff: { type: 'exponential', delay: 3000 } });
