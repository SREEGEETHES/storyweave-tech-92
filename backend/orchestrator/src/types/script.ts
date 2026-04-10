import { z } from 'zod';

export const SceneSchema = z.object({
    duration: z.number().max(30),
    visualPrompt: z.string(),
    emotionTag: z.string(),
    voiceoverText: z.string(),
});

export const VideoScriptSchema = z.object({
    title: z.string(),
    blueprintVersion: z.string(),
    templateId: z.string(),
    styleId: z.string(),
    scenes: z.array(SceneSchema),
});

export type VideoScript = z.infer<typeof VideoScriptSchema>;
export type Scene = z.infer<typeof SceneSchema>;
