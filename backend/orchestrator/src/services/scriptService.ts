import { VideoScriptSchema, VideoScript } from '../types/script.js';
import { analyzePrompt } from './strategyEngine.js';
import { getTemplateById } from '../templates/viralTemplates.js';
import { getVisualPreset, getVoicePresetByEmotion } from './presetEngine.js';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'tinyllama';

export const generateScript = async (vision: string, duration: string): Promise<VideoScript> => {
  // 1. Intellectual Analysis
  const strategy = await analyzePrompt(vision);
  const template = getTemplateById(strategy.suggestedTemplateId);
  const visualPreset = getVisualPreset(strategy.suggestedStyleId);
  const voicePreset = getVoicePresetByEmotion(strategy.emotion);

  console.log(`Using Template: ${template.name} for Topic: ${strategy.topic}`);

  // 2. Construct Template-Driven Prompt
  const slotsDescription = template.slots.map(s => `- ${s.id}: ${s.name} (${s.description}, ${s.durationRange[0]}-${s.durationRange[1]}s)`).join('\n');

  const prompt = `
    You are an expert video scriptwriter. Your task is to fill in the missing content for a viral video script based on a strategy blueprint.
    
    Topic: "${strategy.topic}"
    Category: "${strategy.category}"
    Emotion: "${strategy.emotion}"
    Goal: "${strategy.goal}"
    Style: "${visualPreset.name}" (${visualPreset.artDirection})
    Voice: "${voicePreset.name}" (${voicePreset.tone})
    
    Energy Curve: ${strategy.energyCurve.join(' -> ')}

    Fill in exactly these slots:
    ${slotsDescription}

    For each slot, provide a "visualPrompt" and "voiceoverText".
    The visualPrompt must adhere to the style: "${visualPreset.artDirection}".
    
    Output a STRICT JSON object in this format:
    {
      "title": "Clean Video Title",
      "scenes": [
        {
          "duration": 5, 
          "visualPrompt": "Detailed description...",
          "emotionTag": "${strategy.emotion}",
          "voiceoverText": "The text to be spoken..."
        }
      ]
    }

    Rules:
    - Match the requested number of scenes (one per slot).
    - Ensure scene durations total approximately ${duration}.
    - visualPrompt must be vivid and match Art Direction.
    - Output ONLY the JSON object.
  `;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const json = JSON.parse(data.response);

    const result = {
      ...json,
      blueprintVersion: '1.0',
      templateId: template.id,
      styleId: visualPreset.id,
    };

    return VideoScriptSchema.parse(result);
  } catch (err) {
    console.error('Script generation failed:', err);
    throw new Error('Failed to generate template-driven script');
  }
};
