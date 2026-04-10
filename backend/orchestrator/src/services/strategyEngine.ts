import { ContentStrategy, ContentStrategySchema } from '../types/strategy.js';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'tinyllama';

export const analyzePrompt = async (prompt: string): Promise<ContentStrategy> => {
    const systemPrompt = `
    You are a Viral Content Strategist. Your task is to analyze a video idea and determine the best psychological strategy for high retention.
    
    Categorize the idea, detect the dominant emotion, the content goal, complexity, and urgency.
    Suggest a viral template and a visual style.
    Define an energy curve for the video (e.g. low, medium, high, peak).
    
    Output a STRICT JSON object with this exact structure:
    {
      "topic": "Cleaned up topic name",
      "category": "e.g. Technology, Health, Finance",
      "goal": "Educate | Shock | Inspire | Entertain | Warn | Provoke debate",
      "emotion": "Fear | Awe | Inspiration | Curiosity | Urgency | Nostalgia",
      "complexity": "Surface | Complex",
      "urgency": "Low | Medium | High",
      "energyCurve": ["low", "medium", "high", "peak"],
      "suggestedTemplateId": "e.g. Hook_Flip_v1",
      "suggestedStyleId": "e.g. Cinematic_Dark_v1"
    }

    Rules:
    - Output ONLY the JSON object.
    - Be decisive.
  `;

    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                system: systemPrompt,
                prompt: `Analyze this idea: "${prompt}"`,
                stream: false,
                format: 'json',
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data: any = await response.json();
        const json = JSON.parse(data.response);
        return ContentStrategySchema.parse(json);
    } catch (err) {
        console.error('Strategy analysis failed, using fallback:', err);
        // Fallback strategy
        return {
            topic: prompt,
            category: 'General',
            goal: 'Educate',
            emotion: 'Curiosity',
            complexity: 'Surface',
            urgency: 'Medium',
            energyCurve: ['low', 'medium', 'high', 'peak'],
            suggestedTemplateId: 'Curiosity_Explainer_v1',
            suggestedStyleId: 'Modern_Bright_v1',
        };
    }
};
