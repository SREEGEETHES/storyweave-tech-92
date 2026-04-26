import { supabase } from "@/integrations/supabase/client";
import type { VideoState } from "@/types/index";

export interface AnalyzedStyle {
    cutsPerMinute: number;
    colorProfile: string;
    typography: string;
    styleConfidence: number;
    name: string;
}

export interface ScheduledPost {
    id: number;
    title: string;
    platform: string;
    time: string;
    status: "Scheduled" | "Queue" | "Draft";
    date: string;
    thumbnailUrl?: string;
}

export interface CharacterData {
    name: string;
    description: string;
    imageUrl?: string;
}

export interface ScriptSegment {
    text: string;
    visualPrompt: string;
}

export interface AudioSegment {
    /** S3 URL of the voiceover audio (Qwen3-TTS) */
    url: string;
    /** Duration of the audio in seconds */
    duration: number;
}

export interface BGMSegment {
    /** S3 URL of the background music track (ACE-Step 1.5) */
    url: string;
    /** Actual duration of the generated track in seconds */
    duration: number;
}

export interface CaptionSegment {
    text: string;
    startFrame: number;
    endFrame: number;
}

export interface VideoSegment {
    /** S3 URL of the generated scene image (Seedream 5.0 Lite) */
    url: string;
    duration: number;
}

export interface GenerationConfig {
    /** DNA from selected style (cuts, colors, fonts, avg_shot_length) */
    dna?: {
        avg_shot_length?: number;
        transitions?: string[];
        color_palette?: string;
        typography?: string;
    };
    /** Selected character info */
    character?: {
        name: string;
        description: string;
        imageUrl?: string;
    };
    /** Voice ID for TTS */
    voiceId?: string;
    /** Frame aspect ratio */
    frameSize?: string;
    /** Music vibe for BGM */
    musicVibe?: 'cinematic' | 'lofi' | 'energetic' | 'sad' | 'corporate' | 'epic';
    /** Custom uploaded music URL */
    customMusicUrl?: string;
    /** Generation ID for progress tracking */
    generationId?: string;
}

// =========================================================================
// Progress Tracking Helper
// =========================================================================
async function updateProgress(generationId: string, message: string, percent: number): Promise<void> {
    if (!generationId) return;
    try {
        await supabase
            .from('generations')
            .update({ 
                status_message: message,
                progress_percent: percent
            })
            .eq('id', generationId);
    } catch (err) {
        console.warn('Progress update failed:', err);
    }
}

export const aiService = {

    // =========================================================================
    // 1. Style Analysis
    // =========================================================================
    analyzeVideoStyle: async (file: File): Promise<AnalyzedStyle> => {
        console.log("Analyzing file:", file.name);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
            cutsPerMinute: Math.floor(Math.random() * (60 - 20) + 20),
            colorProfile: Math.random() > 0.5 ? "High Contrast" : "Cinematic Warmth",
            typography: Math.random() > 0.5 ? "Impact Bold" : "Modern Sans",
            styleConfidence: Math.floor(Math.random() * (99 - 85) + 85),
            name: "Analyzed Style #" + Math.floor(Math.random() * 1000),
        };
    },

    // =========================================================================
    // 2. Character Storage
    // =========================================================================
    storeCharacter: async (character: CharacterData): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const { error } = await supabase.from('characters').insert([{
            user_id: user.id,
            name: character.name,
            description: character.description,
            image_url: character.imageUrl,
            generated_images: character.imageUrl ? [character.imageUrl] : []
        }]);
        if (error) {
            console.error("Supabase Error:", error);
            return false;
        }
        return true;
    },

    // =========================================================================
    // 3a. Script Generation (Ollama via Supabase Edge Function)
    // =========================================================================
    generateScript: async (
        topic: string,
        config?: GenerationConfig
    ): Promise<ScriptSegment[]> => {
        console.log("[Brain] Generating script for:", topic);
        
        const context = config?.character 
            ? ` Feature ${config.character.name} described as ${config.character.description} in every scene description.` 
            : '';
        
        const dnaNote = config?.dna?.avg_shot_length
            ? ` Keep scenes to ${config.dna.avg_shot_length} seconds max (avg_shot_length from style DNA).`
            : '';
        
        const fullPrompt = `${topic}. ${context} ${dnaNote}`;
        
        try {
            const { data, error } = await supabase.functions.invoke('generate-script', {
                body: { 
                    topic: fullPrompt,
                    character: config?.character,
                    dna: config?.dna
                }
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Script generation error:", error);
            await new Promise((resolve) => setTimeout(resolve, 600));
            return [
                { text: `Welcome to the future of ${topic}.`, visualPrompt: `Futuristic ${topic} concept art, cinematic lighting` },
                { text: "Innovation is reshaping the world.", visualPrompt: "Abstract digital network, glowing nodes, dark background" },
            ];
        }
    },

    // =========================================================================
    // 3b. Voiceover — Qwen3-TTS (via generate-audio edge function)
    // =========================================================================
    generateAudio: async (
        text: string,
        options: { voice?: string; language?: string; speed?: number } = {}
    ): Promise<AudioSegment> => {
        console.log("[Qwen3-TTS] Synthesising:", text.slice(0, 60));
        try {
            const { data, error } = await supabase.functions.invoke('generate-audio', {
                body: { text, ...options }
            });
            if (error) throw error;
            return { url: data.url, duration: data.duration };
        } catch (error) {
            console.error("Qwen3-TTS error:", error);
            await new Promise((resolve) => setTimeout(resolve, 400));
            // Estimate duration from word count (~140 WPM)
            return {
                url: "https://example.com/mock-audio.mp3",
                duration: Math.max(2, (text.split(' ').length / 140) * 60)
            };
        }
    },

    // =========================================================================
    // 3c. Background Music — ACE-Step 1.5 (via generate-bgm edge function)
    // =========================================================================
    generateBGM: async (
        prompt: string,
        options: { duration?: number; bpm?: number; genre?: string; mood?: string } = {}
    ): Promise<BGMSegment> => {
        const { duration = 30, bpm = 120, genre = 'cinematic', mood = 'neutral' } = options;
        console.log(`[ACE-Step 1.5] Generating ${duration}s BGM: "${prompt}"`);
        try {
            const { data, error } = await supabase.functions.invoke('generate-bgm', {
                body: { prompt, duration, bpm, genre, mood }
            });
            if (error) throw error;
            return { url: data.url, duration: data.duration };
        } catch (error) {
            console.error("ACE-Step BGM error:", error);
            await new Promise((resolve) => setTimeout(resolve, 300));
            return {
                url: "https://example.com/mock-bgm.mp3",
                duration
            };
        }
    },

    // =========================================================================
    // 3d. Captioning — Whisper (via generate-captions edge function)
    // =========================================================================
    generateCaptions: async (
        audioUrl: string,
        options: { language?: string; fps?: number } = {}
    ): Promise<CaptionSegment[]> => {
        const { language = 'en', fps = 30 } = options;
        console.log("[Whisper] Transcribing:", audioUrl);
        try {
            const { data, error } = await supabase.functions.invoke('generate-captions', {
                body: { audioUrl, language, fps }
            });
            if (error) throw error;
            return data.captions as CaptionSegment[];
        } catch (error) {
            console.error("Whisper captioning error:", error);
            await new Promise((resolve) => setTimeout(resolve, 300));
            // Return empty captions so the rest of the pipeline is not blocked
            return [];
        }
    },

    // =========================================================================
    // 3e. Scene Image — Seedream 5.0 Lite (via generate-visuals edge function)
    // =========================================================================
    generateVideoSegment: async (
        prompt: string,
        duration: number,
        character?: { name: string; description: string; imageUrl?: string },
        options: { frameSize?: '16:9' | '9:16' | '1:1'; steps?: number; seed?: number } = {}
    ): Promise<VideoSegment> => {
        // Inject character context for face consistency
        let enhancedPrompt = prompt;
        if (character?.name && character?.description) {
            enhancedPrompt = `Featuring ${character.name}, a ${character.description}. Reference: ${character.imageUrl || 'no reference'}. ${prompt}`;
        }
        
        console.log(`[Seedream] Generating image for: "${enhancedPrompt.slice(0, 80)}"`);
        try {
            const { data, error } = await supabase.functions.invoke('generate-visuals', {
                body: { 
                    prompt: enhancedPrompt, 
                    characterImageUrl: character?.imageUrl,
                    ...options 
                }
            });
            if (error) throw error;
            return { url: data.url, duration };
        } catch (error) {
            console.error("Seedream error:", error);
            await new Promise((resolve) => setTimeout(resolve, 500));
            return { url: "https://example.com/mock-segment.png", duration };
        }
    },

    // =========================================================================
    // 4. Main Orchestrator — Full VideoState generation
    //    Audio-First → Visuals → BGM → Captions → VideoState
    // =========================================================================
    generateVideo: async (
        prompt: string,
        durationType: 'short' | 'long',
        config?: GenerationConfig
    ): Promise<VideoState> => {
        const FPS = 30;
        const dna = config?.dna;
        const avgShotLength = dna?.avg_shot_length ?? 3;
        const genId = config?.generationId;
        
        console.log(`\n--- STORYWEAVE GENERATION STARTED (${durationType}) ---`);
        console.log(`> Config: DNA avg_shot=${avgShotLength}s, frameSize=${config?.frameSize}, musicVibe=${config?.musicVibe}`);

        // Step 1: Script with DNA/Character context (25%)
        if (genId) await updateProgress(genId, 'Generating script...', 25);
        const scriptSegments = await aiService.generateScript(prompt, config);
        console.log(`> Script: ${scriptSegments.length} segments`);
        if (genId) await updateProgress(genId, 'Script generated', 25);

        const scenes: VideoState['scenes'] = [];
        const audioUrls: string[] = [];
        let currentFrame = 0;

        // Step 2: Per-segment audio + visuals (50%)
        for (let i = 0; i < scriptSegments.length; i++) {
            const segment = scriptSegments[i];
            console.log(`\n[Segment ${i + 1}/${scriptSegments.length}]`);

            const audio = await aiService.generateAudio(segment.text);
            console.log(`  > TTS: ${audio.duration.toFixed(2)}s`);
            audioUrls.push(audio.url);

            const durationInFrames = Math.round(audio.duration * FPS);

            const image = await aiService.generateVideoSegment(segment.visualPrompt, audio.duration, config?.character);
            console.log(`  > Image: ${image.url}`);

            // Randomize Ken Burns direction for visual variety
            const kenBurnsDirections = ['zoom_in', 'zoom_out', 'pan_left', 'pan_right'];
            const kenBurnsDirection = kenBurnsDirections[Math.floor(Math.random() * kenBurnsDirections.length)];

            scenes.push({
                id: `scene_${i}`,
                startFrame: currentFrame,
                durationInFrames,
                transitionType: 'fade',
                visualType: 'image',
                visualUrl: image.url,
                kenBurnsEffect: true,
                kenBurnsDirection,
            });

            currentFrame += durationInFrames;
        }

        const totalFrames = currentFrame;
        const totalDurationSeconds = totalFrames / FPS;

        // Step 3: Background music (only generate if custom music is NOT provided)
        const musicVibe = config?.musicVibe ?? 'cinematic';
        let bgmUrl = config?.customMusicUrl;

        if (!bgmUrl) {
            if (genId) await updateProgress(genId, 'Generating music...', 50);
            console.log(`\n> Generating BGM (${totalDurationSeconds.toFixed(1)}s, vibe=${musicVibe})…`);
            const bgm = await aiService.generateBGM(
                `${prompt} — ${musicVibe} background music`,
                { 
                    duration: totalDurationSeconds, 
                    genre: musicVibe === 'lofi' ? 'lo-fi' : musicVibe === 'corporate' ? 'corporate' : 'cinematic', 
                    mood: musicVibe === 'sad' ? 'sad' : musicVibe === 'energetic' ? 'upbeat' : musicVibe === 'epic' ? 'epic' : 'neutral' 
                }
            );
            bgmUrl = bgm.url;
            console.log(`  > BGM: ${bgmUrl}`);
        } else {
            console.log(`\n> Using Custom Music: ${bgmUrl}`);
        }
        
        if (genId) await updateProgress(genId, 'Generating captions...', 75);

        // Step 4: Captions (Whisper transcribes the first/merged voiceover)
        console.log("\n> Generating captions (Whisper)…");
        const captions = await aiService.generateCaptions(audioUrls[0] ?? '', { fps: FPS });
        console.log(`  > ${captions.length} caption segments`);
        if (genId) await updateProgress(genId, 'Rendering video...', 90);

        // Step 5: Assemble VideoState
        const videoState: VideoState = {
            id: `vs_${Date.now()}`,
            global: {
                fps: FPS,
                durationInFrames: totalFrames,
                width: 1920,
                height: 1080,
                backgroundColor: '#000000',
            },
            audio: {
                voiceoverUrl: audioUrls[0],   // Qwen3-TTS
                bgmUrl: bgmUrl || '',         // ACE-Step 1.5 or Custom
                volumeBgm: 0.3,
            },
            captions,                         // Whisper
            scenes,                           // Seedream 5.0 Lite
        };

        console.log("\n--- GENERATION COMPLETE ---");
        console.log(`Total: ${totalFrames} frames (${totalDurationSeconds.toFixed(1)}s) @ ${FPS}fps`);

        if (genId) await updateProgress(genId, 'Complete!', 100);

        return videoState;
    },

    // =========================================================================
    // 5. Thumbnail Generation
    // =========================================================================
    generateThumbnail: async (prompt: string): Promise<string> => {
        console.log("Generating thumbnail for:", prompt);
        try {
            const { data, error } = await supabase.functions.invoke('generate-visuals', {
                body: {
                    prompt: `YouTube Thumbnail: ${prompt}, bold text overlay space, high contrast, cinematic`,
                    frameSize: '16:9',
                    steps: 25,
                }
            });
            if (error) throw error;
            return data.url;
        } catch (error) {
            console.error("Thumbnail error:", error);
            return `https://picsum.photos/seed/${Date.now()}/1280/720`;
        }
    },

    // =========================================================================
    // 6. AutoPilot — Content Scheduling
    // =========================================================================
    generateContentSchedule: async (niche: string): Promise<ScheduledPost[]> => {
        console.log("Generating schedule for niche:", niche);
        await new Promise((resolve) => setTimeout(resolve, 600));
        const platforms = ["YouTube Shorts", "TikTok", "Instagram Reels"];
        return Array.from({ length: 3 }).map((_, i) => ({
            id: Date.now() + i,
            title: `${niche} Idea #${i + 1}: ${Math.random().toString(36).substring(7)}`,
            platform: platforms[i % 3],
            time: "10:00 AM",
            status: "Draft" as const,
            date: "Tomorrow",
            thumbnailUrl: `https://picsum.photos/seed/${Date.now() + i}/300/500`
        }));
    },

    // =========================================================================
    // 7. Social Uploader
    // =========================================================================
    uploadToSocials: async (post: ScheduledPost): Promise<boolean> => {
        console.log(`Uploading to ${post.platform}: ${post.title}`);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return true;
    },

    // =========================================================================
    // 8. Context-Based Idea Generation
    // =========================================================================
    generateIdeasFromContext: async (file: File): Promise<ScheduledPost[]> => {
        console.log("Reading context from file:", file.name);
        await new Promise((resolve) => setTimeout(resolve, 800));
        const platforms = ["YouTube Shorts", "TikTok", "Instagram Reels"];
        return Array.from({ length: 3 }).map((_, i) => ({
            id: Date.now() + i,
            title: `Contextual Idea from ${file.name.slice(0, 15)}…`,
            platform: platforms[i % 3],
            time: "12:00 PM",
            status: "Draft" as const,
            date: "Next Week",
            thumbnailUrl: `https://picsum.photos/seed/${Date.now() + i + 100}/300/500`
        }));
    },
};
