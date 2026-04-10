import { validateRetention } from '../services/retentionValidator.js';
import { VideoScript } from '../types/script.js';

async function testValidator() {
    const mockScript: VideoScript = {
        title: 'Tech Warning',
        blueprintVersion: '1.0',
        templateId: 'Fear_Future_v1',
        styleId: 'Cinematic_Dark_v1',
        scenes: [
            {
                duration: 10, // Should be auto-split
                visualPrompt: 'Dark futuristic city with drones everywhere',
                emotionTag: 'Fear',
                voiceoverText: 'The future is not what we were promised. Drones fill the sky, watching every move you make.'
            },
            {
                duration: 2,
                visualPrompt: 'Short', // Should trigger error if < 10 chars
                emotionTag: 'Fear',
                voiceoverText: 'Be careful.'
            }
        ]
    };

    console.log(`--- Running Retention Validator Test ---`);
    const { script, result } = validateRetention(mockScript);

    console.log('Validation Results:');
    console.log('Errors:', result.errors);
    console.log('Warnings:', result.warnings);
    console.log('Auto-Fixes applied:', result.autoFixes);
    console.log('\nFinal Scene Count:', script.scenes.length);

    script.scenes.forEach((s, i) => {
        console.log(`Scene ${i + 1} (${s.duration}s): ${s.visualPrompt}`);
    });
}

testValidator();
