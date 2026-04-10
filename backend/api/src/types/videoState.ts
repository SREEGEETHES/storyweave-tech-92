import { z } from 'zod';

// ---------------------------------------------------------------------------
// VideoState schema — mirrors src/types/index.ts in the frontend exactly.
// Used to validate POST /render request bodies.
// ---------------------------------------------------------------------------

const sceneSchema = z.object({
    id: z.string(),
    startFrame: z.number().int().nonnegative(),
    durationInFrames: z.number().int().positive(),
    transitionType: z.enum(['fade', 'slide', 'none']).optional(),
    visualType: z.enum(['image', 'video', 'gif']),
    visualUrl: z.string().min(1),
    kenBurnsEffect: z.boolean().optional(),
});

const captionSchema = z.object({
    text: z.string(),
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
});

export const videoStateSchema = z.object({
    id: z.string(),
    global: z.object({
        fps: z.number().int().positive().default(30),
        durationInFrames: z.number().int().positive(),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        backgroundColor: z.string().optional(),
    }),
    audio: z.object({
        voiceoverUrl: z.string().optional(),
        bgmUrl: z.string().optional(),
        volumeBgm: z.number().min(0).max(1).default(0.3),
    }),
    captions: z.array(captionSchema).default([]),
    scenes: z.array(sceneSchema),
});

export type VideoState = z.infer<typeof videoStateSchema>;
