import { VideoScript, Scene } from '../types/script.js';
import { getTemplateById } from '../templates/viralTemplates.js';
import { getVisualPreset, getVoicePresetByEmotion } from './presetEngine.js';

export interface ValidationResult {
    isValid: boolean;
    warnings: string[];
    errors: string[];
    autoFixes: number;
}

export const validateRetention = (script: VideoScript): { script: VideoScript; result: ValidationResult } => {
    const warnings: string[] = [];
    const errors: string[] = [];
    let autoFixes = 0;

    const template = getTemplateById(script.templateId);
    const visualPreset = getVisualPreset(script.styleId);
    const voicePreset = getVoicePresetByEmotion(template.emotion); // Or from script metadata if stored
    const newScenes: Scene[] = [];

    // 1. Rule: Hook Impact (First scene < 3s)
    if (script.scenes.length > 0 && script.scenes[0].duration > 3) {
        warnings.push(`Hook scene is too long (${script.scenes[0].duration}s). Recommended < 3s for ${template.name}.`);
    }

    // 2. Rule: Visual Consistency (Art Direction enforcement)
    const artKeywords = visualPreset.artDirection.toLowerCase().split(',').map(k => k.trim());

    // 3. Rule: Pacing & Dynamics (Audio rhythm + Auto-split)
    let punchSceneCount = 0;
    for (let i = 0; i < script.scenes.length; i++) {
        const scene = script.scenes[i];

        // Visual drift check
        const hasArtDirection = artKeywords.some(k => scene.visualPrompt.toLowerCase().includes(k));
        if (!hasArtDirection) {
            warnings.push(`Scene ${i + 1} visual prompt might drift from ${visualPreset.name} style.`);
        }

        // Audio rhythm check (Sentence length)
        const sentenceLength = scene.voiceoverText.split(/\.|\?|!/).length;
        if (sentenceLength > 1 && scene.voiceoverText.split(' ').length > voicePreset.rhythmRules.maxSentenceLength) {
            warnings.push(`Scene ${i + 1} has long sentence. Breaking flow for ${voicePreset.name}.`);
        }

        // Pacing Auto-Adjust (Scenes > 6s auto-split)
        if (scene.duration > 6) {
            autoFixes++;
            console.log(`Auto-splitting scene: "${scene.visualPrompt.substring(0, 20)}..."`);

            const part1: Scene = {
                ...scene,
                duration: scene.duration / 2,
                visualPrompt: `${scene.visualPrompt} (Part 1 - Dynamic establishing shot)`,
                voiceoverText: scene.voiceoverText.split(' ').slice(0, Math.floor(scene.voiceoverText.split(' ').length / 2)).join(' '),
            };

            const part2: Scene = {
                ...scene,
                duration: scene.duration / 2,
                visualPrompt: `${scene.visualPrompt} (Part 2 - Close-up / Detailed angle)`,
                voiceoverText: scene.voiceoverText.split(' ').slice(Math.floor(scene.voiceoverText.split(' ').length / 2)).join(' '),
            };

            newScenes.push(part1, part2);
        } else {
            newScenes.push(scene);
        }
    }

    // 3. Rule: Audio Dynamics (No silent gaps) - Simplified for now
    // (Actual check would happen in Stage 3 with TTS timing)

    // 4. Rule: Scene Density (No empty visuals)
    newScenes.forEach((s, i) => {
        if (!s.visualPrompt || s.visualPrompt.length < 10) {
            errors.push(`Scene ${i + 1} has weak visual directive.`);
        }
    });

    const result: ValidationResult = {
        isValid: errors.length === 0,
        warnings,
        errors,
        autoFixes,
    };

    return {
        script: { ...script, scenes: newScenes },
        result,
    };
};
