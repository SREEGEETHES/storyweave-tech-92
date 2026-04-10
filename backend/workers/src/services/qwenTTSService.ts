/**
 * Qwen3-TTS Client Service
 * -------------------------
 * Calls the StoryWeave GPU server's /tts/generate endpoint.
 * Qwen3-TTS is Alibaba's state-of-the-art multilingual TTS model.
 * The GPU server handles model inference and S3 upload;
 * this client simply sends the request and returns the audio URL + duration.
 */

import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GPU_SERVER_URL = process.env.GPU_SERVER_URL || 'http://localhost:8000';
const GPU_SERVER_API_KEY = process.env.GPU_SERVER_API_KEY || '';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export interface QwenTTSOptions {
    /** BCP-47 language code — e.g. 'en', 'zh', 'es'. Defaults to 'en'. */
    language?: string;
    /** Playback speed multiplier (0.5 – 2.0). Defaults to 1.0. */
    speed?: number;
    /** Model-specific voice name or ID. Defaults to 'default'. */
    voice?: string;
}

export interface TTSResult {
    /** S3 URL of the generated audio file */
    audioUrl: string;
    /** Duration of the generated audio in seconds */
    durationSeconds: number;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a voiceover audio file from text using Qwen3-TTS.
 *
 * @param text     The narration text to synthesise.
 * @param options  Optional voice/language/speed overrides.
 * @returns        S3 URL and duration of the generated audio.
 */
export async function generateTTS(text: string, options: QwenTTSOptions = {}): Promise<TTSResult> {
    const { language = 'en', speed = 1.0, voice = 'default' } = options;

    const payload = { text, language, speed, voice };
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (GPU_SERVER_API_KEY) {
        headers['X-API-Key'] = GPU_SERVER_API_KEY;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            const response = await axios.post<{ audio_url: string; duration_seconds: number }>(
                `${GPU_SERVER_URL}/tts/generate`,
                payload,
                { headers, timeout: 120_000 }
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
            console.error(`[QwenTTS] Attempt ${attempt}/${RETRY_ATTEMPTS} failed:`, lastError.message);

            if (attempt < RETRY_ATTEMPTS) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    throw lastError ?? new Error('Qwen3-TTS: unknown failure after retries');
}
