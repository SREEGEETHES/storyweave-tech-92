export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    plan: "Free" | "Pro" | "Enterprise";
}

export interface VideoProject {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    status: "draft" | "processing" | "completed" | "failed";
    created_at: string;
    updated_at: string;
    thumbnail_url?: string;
    video_url?: string;
}

export interface Character {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    reference_image_path?: string;
    generated_images: string[];
    parameters: Record<string, any>;
    created_at: string;
}

export interface DashboardStats {
    videosCreated: number;
    charactersCreated: number;
    plan: string;
}

export interface VideoState {
    id: string; // Ties back to VideoProject.id
    global: {
        fps: number;
        durationInFrames: number;
        width: number;
        height: number;
        backgroundColor?: string;
    };
    audio: {
        voiceoverUrl?: string; // Qwen3-TTS audio
        bgmUrl?: string; // ACE-Step 1.5 music
        volumeBgm: number;
    };
    captions: {
        text: string;
        startFrame: number;
        endFrame: number;
    }[];
    scenes: {
        id: string;
        startFrame: number;
        durationInFrames: number;
        transitionType?: 'fade' | 'slide' | 'none';
        visualType: 'image' | 'video' | 'gif';
        visualUrl: string; // Seedream image / Tenor GIF URL
        kenBurnsEffect?: boolean;
    }[];
}
