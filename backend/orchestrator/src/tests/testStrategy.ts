import { analyzePrompt } from '../services/strategyEngine.js';

async function testStrategy() {
    const prompt = 'The hidden danger of using AI for everything without thinking.';
    console.log(`Analyzing: "${prompt}"`);

    try {
        const strategy = await analyzePrompt(prompt);
        console.log('Strategy Analysis:', JSON.stringify(strategy, null, 2));
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testStrategy();
