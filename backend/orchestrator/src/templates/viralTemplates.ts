import { DominantEmotion, ContentGoal } from '../types/strategy.js';

export interface ViralTemplate {
    id: string;
    name: string;
    description: string;
    emotion: DominantEmotion;
    goal: ContentGoal;
    energyCurve: string[];
    slots: {
        id: string;
        name: string;
        description: string;
        durationRange: [number, number];
    }[];
}

export const viralTemplates: ViralTemplate[] = [
    {
        id: 'Curiosity_Explainer_v1',
        name: 'The Curiosity Loop',
        description: 'Starts with a "Did you know?" style hook and closes with a satisfying explanation.',
        emotion: 'Curiosity',
        goal: 'Educate',
        energyCurve: ['medium', 'high', 'peak', 'medium'],
        slots: [
            { id: 'hook', name: 'Curiosity Hook', description: 'A question or fact that breaks their scrolling pattern.', durationRange: [2, 4] },
            { id: 'patternInterrupt', name: 'The Twist', description: 'A visual or auditory shock that reframes the topic.', durationRange: [3, 5] },
            { id: 'coreLoop', name: 'The Explanation', description: 'The main narrative content.', durationRange: [10, 20] },
            { id: 'retentionFlip', name: 'The Pro-Tip', description: 'A surprising secondary fact or flip.', durationRange: [5, 8] },
            { id: 'cta', name: 'The Authority CTA', description: 'Concluding statement with a call to action.', durationRange: [3, 5] },
        ],
    },
    {
        id: 'Fear_Future_v1',
        name: 'The Dark Mystery',
        description: 'Focuses on a warning or a dark potential future to create urgency.',
        emotion: 'Fear',
        goal: 'Warn',
        energyCurve: ['high', 'high', 'high', 'peak'],
        slots: [
            { id: 'hook', name: 'Fear Hook', description: 'A warning or a "The truth about..." statement.', durationRange: [2, 3] },
            { id: 'patternInterrupt', name: 'The Escalation', description: 'Showing the worst-case scenario.', durationRange: [4, 6] },
            { id: 'coreLoop', name: 'The Investigation', description: 'Evidence or details of the warning.', durationRange: [12, 18] },
            { id: 'retentionFlip', name: 'The Silver Lining', description: 'How to avoid the danger.', durationRange: [5, 7] },
            { id: 'cta', name: 'The Loop CTA', description: 'A cliffhanger CTA that leads to the next part.', durationRange: [3, 5] },
        ],
    },
    {
        id: 'Awe_Inspiration_v1',
        name: 'The Transformation Arc',
        description: 'Starts with intense wonder and moves to a motivational climax.',
        emotion: 'Awe',
        goal: 'Inspire',
        energyCurve: ['low', 'medium', 'high', 'peak'],
        slots: [
            { id: 'hook', name: 'Awe Hook', description: 'Breathtaking visual or profound statement.', durationRange: [3, 5] },
            { id: 'patternInterrupt', name: 'The Reality Check', description: 'The humble beginning or the contrast.', durationRange: [4, 6] },
            { id: 'coreLoop', name: 'The Climb', description: 'The process of transformation or growth.', durationRange: [15, 25] },
            { id: 'retentionFlip', name: 'The Climax', description: 'The final, peak inspiration point.', durationRange: [5, 8] },
            { id: 'cta', name: 'The Motivational CTA', description: 'Direct call to empower the user.', durationRange: [4, 6] },
        ],
    },
    // More templates can be added here
];

export const getTemplateById = (id: string): ViralTemplate => {
    return viralTemplates.find((t) => t.id === id) || viralTemplates[0];
};
