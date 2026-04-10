/**
 * Whisper Captioning Client Service
 * -----------------------------------
 * Calls the StoryWeave GPU server's /transcribe endpoint.
 * Whisper (faster-whisper large-v3) transcribes an audio file and returns
 * caption segments aligned to video frames (startFrame / endFrame).
 *
 * The returned segments map directly to VideoState.captions[].
 */

import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GPU_SERVER_URL = process.env.GPU_SERVER_URL || 'http://localhost:8000';
const GPU_SERVER_API_KEY = process.env.GPU_SERVER_API_KEY || '';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/** Matches VideoState.captions[] exactly */
export interface CaptionSegment {
    text: string;
    startFrame: number;
    endFrame: number;
}

export interface WhisperResult {
    /** Caption segments aligned to video frames */
    segments: CaptionSegment[];
    /** Full transcript as a single string */
    fullText: string;
}

export interface WhisperOptions {
    /**
     * BCP-47 language code — e.g. 'en', 'zh', 'es'.
     * Use 'auto' to let Whisper detect the language automatically.
     * Defaults to 'en'.
     */
    language?: string;
    /** Frames per second of the destination Remotion composition. Defaults to 30. */
    fps?: number;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Transcribe an audio file with Whisper and return frame-aligned captions.
 *
 * @param audioUrl  Public URL of the voiceover audio file (e.g. from Qwen3-TTS).
 * @param options   Language and FPS settings.
 * @returns         Array of caption segments ready to write into VideoState.captions.
 */
export async function transcribeAudio(audioUrl: string, options: WhisperOptions = {}): Promise<WhisperResult> {
    const { language = 'en', fps = 30 } = options;

    const payload = { audio_url: audioUrl, language, fps };
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (GPU_SERVER_API_KEY) {
        headers['X-API-Key'] = GPU_SERVER_API_KEY;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            const response = await axios.post<{
                segments: Array<{ text: string; start_frame: number; end_frame: number }>;
                full_text: string;
            }>(
                `${GPU_SERVER_URL}/transcribe`,
                payload,
                { headers, timeout: 180_000 }
            );

            // Map snake_case GPU server response → camelCase VideoState shape
            const segments: CaptionSegment[] = response.data.segments.map(seg => ({
                text: seg.text,
                startFrame: seg.start_frame,
                endFrame: seg.end_frame,
            }));

            return { segments, fullText: response.data.full_text };
        } catch (err) {
            const axiosErr = err as AxiosError;
            lastError = new Error(
                axiosErr.response
                    ? `GPU server error ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`
                    : `Network error: ${axiosErr.message}`
            );
            console.error(`[Whisper] Attempt ${attempt}/${RETRY_ATTEMPTS} failed:`, lastError.message);

            if (attempt < RETRY_ATTEMPTS) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    throw lastError ?? new Error('Whisper: unknown failure after retries');
}
