/**
 * Seedream 5.0 Lite Client Service
 * ----------------------------------
 * Calls the StoryWeave GPU server's /image/generate endpoint.
 * Seedream (by ByteDance Seed Lab) generates high-quality scene images
 * from a natural-language visual prompt.
 * The result is an S3 URL for the generated PNG, ready to use as
 * VideoState.scenes[].visualUrl.
 */

import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GPU_SERVER_URL = process.env.GPU_SERVER_URL || 'http://localhost:8000';
const GPU_SERVER_API_KEY = process.env.GPU_SERVER_API_KEY || '';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1500;

export interface SeedreamOptions {
    /** Output image width in pixels. Defaults to 1920. */
    width?: number;
    /** Output image height in pixels. Defaults to 1080. */
    height?: number;
    /** Number of diffusion steps. Higher = better quality but slower. Defaults to 30. */
    steps?: number;
    /** Classifier-free guidance scale. Defaults to 7.5. */
    cfgScale?: number;
    /**
     * Negative prompt — describes what to avoid.
     * Defaults to generic quality-improvement negatives.
     */
    negativePrompt?: string;
    /** Optional seed for reproducibility. */
    seed?: number;
}

export interface SeedreamResult {
    /** S3 URL of the generated scene image */
    imageUrl: string;
}

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a scene image using Seedream 5.0 Lite.
 *
 * @param prompt   Visual description of the scene (from the video script).
 * @param options  Resolution, diffusion steps, and guidance parameters.
 * @returns        S3 URL of the generated image.
 */
export async function generateImage(prompt: string, options: SeedreamOptions = {}): Promise<SeedreamResult> {
    const {
        width = 1920,
        height = 1080,
        steps = 30,
        cfgScale = 7.5,
        negativePrompt = 'blurry, low quality, distorted, watermark, text, logo',
        seed,
    } = options;

    const payload = {
        prompt,
        negative_prompt: negativePrompt,
        width,
        height,
        steps,
        cfg_scale: cfgScale,
        ...(seed !== undefined ? { seed } : {}),
    };

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (GPU_SERVER_API_KEY) {
        headers['X-API-Key'] = GPU_SERVER_API_KEY;
    }

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
        try {
            // Image generation can take up to 3 minutes for high-step counts
            const response = await axios.post<{ image_url: string }>(
                `${GPU_SERVER_URL}/image/generate`,
                payload,
                { headers, timeout: 180_000 }
            );

            return { imageUrl: response.data.image_url };
        } catch (err) {
            const axiosErr = err as AxiosError;
            lastError = new Error(
                axiosErr.response
                    ? `GPU server error ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`
                    : `Network error: ${axiosErr.message}`
            );
            console.error(`[Seedream] Attempt ${attempt}/${RETRY_ATTEMPTS} failed:`, lastError.message);

            if (attempt < RETRY_ATTEMPTS) {
                await sleep(RETRY_DELAY_MS * attempt);
            }
        }
    }

    throw lastError ?? new Error('Seedream 5.0 Lite: unknown failure after retries');
}
