import { supabase } from "@/integrations/supabase/client";

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
    url: string;
    duration: number;
}

export interface VideoSegment {
    url: string;
    duration: number;
}

export const aiService = {
    // 1. Style Analysis
    analyzeVideoStyle: async (file: File): Promise<AnalyzedStyle> => {
        console.log("Analyzing file:", file.name);
        // Simulate AI Latency (Reduced for better UX)
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Return mock data based on "analysis"
        return {
            cutsPerMinute: Math.floor(Math.random() * (60 - 20) + 20), // 20-60 cuts
            colorProfile: Math.random() > 0.5 ? "High Contrast" : "Cinematic Warmth",
            typography: Math.random() > 0.5 ? "Impact Bold" : "Modern Sans",
            styleConfidence: Math.floor(Math.random() * (99 - 85) + 85),
            name: "Analyzed Style #" + Math.floor(Math.random() * 1000),
        };
    },

    // 2. Character Storage
    storeCharacter: async (character: CharacterData): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        console.log("Storing character:", character);
        const { error } = await supabase.from('characters').insert([{
            user_id: user.id,
            name: character.name,
            description: character.description,
            image_url: character.imageUrl, // Mapped to new column in DB
            generated_images: character.imageUrl ? [character.imageUrl] : []
        }]);

        if (error) {
            console.error("Supabase Error:", error);
            return false;
        }
        return true;
    },

    // 3. Video Generation (Audio-First Orchestration)
    // ===============================================

    // Step A: Brain (Scripting) - Returns segments tailored for 3-5s clips
    generateScript: async (topic: string): Promise<ScriptSegment[]> => {
        console.log("Brain: Generating script for", topic);
        try {
            const { data, error } = await supabase.functions.invoke('generate-script', {
                body: { topic }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Script Generation Error:", error);
            // Fallback for demo/offline
            await new Promise((resolve) => setTimeout(resolve, 600));
            return [
                { text: `Welcome to the future of ${topic}. (API Error)`, visualPrompt: `Futuristic ${topic} concept art` },
                { text: "We are having trouble connecting to the brain.", visualPrompt: "Broken robot wires, glitched screen" }
            ];
        }
    },

    // Step B: Voice (Audio Driver) - Determines exact duration
    generateAudio: async (text: string): Promise<AudioSegment> => {
        console.log("Voice: Generating audio for:", text);
        try {
            const { data, error } = await supabase.functions.invoke('generate-audio', {
                body: { text }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Audio Generation Error:", error);
            // Return mock on fail to keep UI alive
            await new Promise((resolve) => setTimeout(resolve, 400));
            return {
                url: "https://example.com/mock-audio.mp3",
                duration: Math.max(2, text.split(' ').length * 0.4)
            };
        }
    },

    // Step C: Visuals (Video matched to Audio)
    generateVideoSegment: async (prompt: string, duration: number): Promise<VideoSegment> => {
        console.log(`Video: Generating ${duration.toFixed(1)}s clip for: "${prompt}"`);
        try {
            const { data, error } = await supabase.functions.invoke('generate-visuals', {
                body: { prompt }
            });

            if (error) throw error;
            return {
                url: data.url,
                duration: duration
            };
        } catch (error) {
            console.error("Video Generation Error:", error);
            await new Promise((resolve) => setTimeout(resolve, 500));
            return {
                url: "https://example.com/mock-segment.mp4",
                duration: duration
            };
        }
    },

    // Main Orchestrator (Client-Side for now, could move to Edge too)
    generateVideo: async (prompt: string, durationType: 'short' | 'long') => {
        console.log(`\n--- STARTING REAL AI GENERATION (${durationType}) ---`);

        // 1. Scripting
        const scriptSegments = await aiService.generateScript(prompt);
        console.log(`> Script generated: ${scriptSegments.length} segments`);

        const finalTimeline: any[] = [];

        // 2. Loop through segments (Audio First -> Video Second)
        for (let i = 0; i < scriptSegments.length; i++) {
            const segment = scriptSegments[i];
            console.log(`\n[Processing Segment ${i + 1}/${scriptSegments.length}]`);

            // A. Generate Audio
            const audio = await aiService.generateAudio(segment.text);
            console.log(`  > Audio created (${audio.duration.toFixed(1)}s)`);

            // B. Generate Video (Forced duration)
            const video = await aiService.generateVideoSegment(segment.visualPrompt, audio.duration);
            console.log(`  > Video created (Matched duration: ${video.duration.toFixed(1)}s)`);

            finalTimeline.push({
                sequence: i,
                text: segment.text,
                audioUrl: audio.url,
                videoUrl: video.url,
                duration: audio.duration
            });
        }

        console.log("\n--- GENERATION COMPLETE ---");
        return {
            id: Date.now(),
            status: "completed",
            timeline: finalTimeline
        };
    },

    // 4. Content Scheduling (AutoPilot)
    // 5. Auto-Uploader (Social Media)
    uploadToSocials: async (post: ScheduledPost): Promise<boolean> => {
        console.log(`Uploading to ${post.platform}: ${post.title}`);
        await new Promise((resolve) => setTimeout(resolve, 800));
        // Real implementations would use Supabase Functions to call YouTube API
        return true;
    },

    generateContentSchedule: async (niche: string): Promise<ScheduledPost[]> => {
        console.log("Generating ideas for niche:", niche);
        // Use the same 'generate-script' or a specialized 'generate-ideas' function
        try {
            const { data, error } = await supabase.functions.invoke('generate-script', {
                body: { topic: `Generate 3 viral video ideas for ${niche} niche. Return JSON format.` }
            });
            // Note: The generate-script is tuned for Script Segments, not ideas. 
            // Ideally we'd have a separate 'brain' function. 
            // For now, let's keep the mock for higher reliability until we tune the prompt.
            console.warn("Using mock for Schedule to ensure valid JSON structure for now.");
        } catch (e) { console.error(e) }

        await new Promise((resolve) => setTimeout(resolve, 600));

        const platforms = ["YouTube Shorts", "TikTok", "Instagram Reels"];
        const newPosts: ScheduledPost[] = Array.from({ length: 3 }).map((_, i) => ({
            id: Date.now() + i,
            title: `${niche} Idea #${i + 1}: ${Math.random().toString(36).substring(7)}`,
            platform: platforms[i % 3],
            time: "10:00 AM",
            status: "Draft",
            date: "Tomorrow",
            thumbnailUrl: `https://picsum.photos/seed/${Date.now() + i}/300/500`
        }));

        return newPosts;
    },

    // 6. Thumbnail Generation
    generateThumbnail: async (prompt: string): Promise<string> => {
        console.log("Generating thumbnail for:", prompt);
        try {
            const { data, error } = await supabase.functions.invoke('generate-visuals', {
                body: { prompt: `YouTube Thumbnail for: ${prompt}, high quality, catchy text overlay` }
            });
            if (error) throw error;
            return data.url;
        } catch (error) {
            console.error("Thumbnail Gen Error:", error);
            return `https://picsum.photos/seed/${Date.now()}/300/500`;
        }
    },

    // 7. Context-Based Idea Generation
    generateIdeasFromContext: async (file: File): Promise<ScheduledPost[]> => {
        console.log("Reading context from file:", file.name);

        let fileContent = "";
        try {
            fileContent = await file.text(); // Basic text read
        } catch (e) {
            console.error("File read error", e);
            fileContent = "Context could not be read.";
        }

        // Call Brain with context
        // In real world, we'd send this to 'generate-ideas' function

        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock ideas derived from "file"
        const platforms = ["YouTube Shorts", "TikTok", "Instagram Reels"];
        const newPosts: ScheduledPost[] = Array.from({ length: 3 }).map((_, i) => ({
            id: Date.now() + i,
            title: `Contextual Idea from ${file.name.slice(0, 10)}...`,
            platform: platforms[i % 3],
            time: "12:00 PM",
            status: "Draft",
            date: "Next Week",
            thumbnailUrl: `https://picsum.photos/seed/${Date.now() + i + 100}/300/500`
        }));

        return newPosts;
    }
};
