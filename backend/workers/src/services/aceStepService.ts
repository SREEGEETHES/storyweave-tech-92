/**
 * ACE-Step 1.5 Client Service
 * ----------------------------
 * Calls the StoryWeave GPU server's /bgm/generate endpoint.
 * ACE-Step 1.5 is ByteDance's open-source music generation model.
 * It generates background music matched to a video's mood, genre, and duration.
 * The result is an S3 URL for the generated WAV/MP3.
 */

import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GPU_SERVER_URL = process.env.GPU_SERVER_URL || 'http://localhost:8000';
const GPU_SERVER_API_KEY = process.env.GPU_SERVER_API_KEY || '';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;  // BGM generation is slow; use longer delays

export interface ACEStepOptions {
    /** Desired duration of the music track in seconds. Defaults to 30. */
    duration?: number;
    /** Beats per minute. Defaults to 120. */
    bpm?: number;
    /**
     * Music genre hint — e.g. 'cinematic', 'hip-hop', 'ambient', 'electronic'.
     * Defaults to 'cinematic'.
     */
    genre?: string;
    /**
     * Emotional mood hint — e.g. 'energetic', 'calm', 'dramatic', 'uplifting'.
     * Defaults to 'neutral'.
     */
    mood?: string;
}

export interface BGMResult {
    /** S3 URL of the generated background music file */
    audioUrl: string;
    /** Actual duration of the generated track in seconds */
    durationSeconds: number;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate background music for a video scene using ACE-Step 1.5.
 *
 * @param prompt   Natural-language description of the desired music.
 * @param options  Duration, BPM, genre, and mood parameters.
 * @returns        S3 URL and actual duration of the generated BGM.
 */
export async function generateBGM(prompt: string, options: ACEStepOptions = {}): Promise<BGMResult> {
    const {
        duration = 30,
        bpm = 120,
        genre = 'cinematic',
        mood = 'neutral',
    } = options;

    const payload = { prompt, duration, bpm, genre, mood };
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (GPU_SERVER_API_KEY) {
        headers['X-API-Key'] = GPU_SERVER_API_KEY;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            // BGM generation is compute-intensive; allow up to 5 minutes
            const response = await axios.post<{ audio_url: string; duration_seconds: number }>(
                `${GPU_SERVER_URL}/bgm/generate`,
                payload,
                { headers, timeout: 300_000 }
            );

            return {
                audioUrl: response.data.audio_url,
                durationSeconds: response.data.duration_seconds,
            };
        } catch (err) {
            const axiosErr = err as AxiosError;
            lastError = new Error(
                axiosErr.response
                    ? `GPU server error ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`
                    : `Network error: ${axiosErr.message}`
            );
            console.error(`[ACEStep] Attempt ${attempt}/${RETRY_ATTEMPTS} failed:`, lastError.message);

            if (attempt < RETRY_ATTEMPTS) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    throw lastError ?? new Error('ACE-Step 1.5: unknown failure after retries');
}
