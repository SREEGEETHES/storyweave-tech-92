/**
 * Voice Service
 * -------------
 * BullMQ-facing wrapper around Qwen3-TTS.
 * Called by the voice-generation worker in index.ts.
 */

import { generateTTS, QwenTTSOptions, TTSResult } from './qwenTTSService.js';

export { TTSResult };

/**
 * Generate a voiceover for a script segment.
 *
 * @param text     Narration text to synthesise.
 * @param options  Optional Qwen3-TTS overrides (voice, language, speed).
 * @returns        S3 audio URL and duration in seconds.
 */
export async function generateVoiceover(text: string, options: QwenTTSOptions = {}): Promise<TTSResult> {
    console.log(`[VoiceService] Generating TTS for: "${text.slice(0, 80)}…"`);
    const result = await generateTTS(text, options);
    console.log(`[VoiceService] Done — ${result.durationSeconds.toFixed(2)}s → ${result.audioUrl}`);
    return result;
}
