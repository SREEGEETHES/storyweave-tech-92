import { z } from 'zod';

export const ContentGoalSchema = z.enum([
    'Educate',
    'Shock',
    'Inspire',
    'Entertain',
    'Warn',
    'Provoke debate',
]);

export const DominantEmotionSchema = z.enum([
    'Fear',
    'Awe',
    'Inspiration',
    'Curiosity',
    'Urgency',
    'Nostalgia',
]);

export const EnergyCurveSchema = z.array(z.enum(['low', 'medium', 'high', 'peak']));

export const ContentStrategySchema = z.object({
    topic: z.string(),
    category: z.string(),
    goal: ContentGoalSchema,
    emotion: DominantEmotionSchema,
    complexity: z.enum(['Surface', 'Complex']),
    urgency: z.enum(['Low', 'Medium', 'High']),
    energyCurve: EnergyCurveSchema,
    suggestedTemplateId: z.string(),
    suggestedStyleId: z.string(),
});

export type ContentGoal = z.infer<typeof ContentGoalSchema>;
export type DominantEmotion = z.infer<typeof DominantEmotionSchema>;
export type ContentStrategy = z.infer<typeof ContentStrategySchema>;
