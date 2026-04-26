/**
 * Content Moderation Utilities
 * 
 * Filters restricted keywords and validates user content for safety compliance.
 */

export const RESTRICTED_KEYWORDS = [
    // NSFW/Adult content
    'nsfw', 'porn', 'xxx', '18+', 'adult content', 'nude', 'naked',
    // Hate speech
    'hate speech', 'racist', 'nazi', 'white supremacy', 'extremist',
    // Violence
    'gore', 'murder', 'kill', 'torture', ' Execution',
    // Illegal activity
    'drug', 'weapon', 'gun', 'bomb', 'hack', 'phishing',
    // Harassment
    'bully', 'harass', 'stalk', 'threaten',
];

export const MINIMUN_KEYWORD_LENGTH = 3;

export function containsRestrictedContent(text: string): { isRestricted: boolean; matchedKeywords: string[] } {
    const lowerText = text.toLowerCase();
    const matched: string[] = [];
    
    for (const keyword of RESTRICTED_KEYWORDS) {
        if (lowerText.includes(keyword.toLowerCase())) {
            matched.push(keyword);
        }
    }
    
    return {
        isRestricted: matched.length > 0,
        matchedKeywords: matched
    };
}

export const CONTENT_POLICY_URL = 'https://storyweave.ai/terms';
export const AI_USAGE_POLICY_URL = 'https://storyweave.ai/ai-policy';