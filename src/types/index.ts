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
