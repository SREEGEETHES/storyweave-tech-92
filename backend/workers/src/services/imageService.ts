/**
 * Image Service
 * -------------
 * BullMQ-facing wrapper around Seedream 5.0 Lite.
 * Called by the image-generation worker in index.ts.
 */

import { generateImage as seedreamGenerate, SeedreamOptions, SeedreamResult } from './seedreamService.js';

export { SeedreamResult };

/**
 * Generate a scene image from a visual prompt.
 *
 * @param prompt   Visual description from the video script.
 * @param options  Optional Seedream overrides (resolution, steps, seed).
 * @returns        S3 image URL.
 */
export async function generateImage(prompt: string, options: SeedreamOptions = {}): Promise<SeedreamResult> {
    console.log(`[ImageService] Generating image for: "${prompt.slice(0, 80)}…"`);
    const result = await seedreamGenerate(prompt, options);
    console.log(`[ImageService] Done → ${result.imageUrl}`);
    return result;
}
