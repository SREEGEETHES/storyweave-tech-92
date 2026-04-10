export interface VisualPreset {
    id: string;
    name: string;
    artDirection: string;
    lightingStyle: string;
    colorGrading: string;
    cameraMovement: string;
    transitionStyle: string;
    subtitleStyle: {
        font: string;
        color: string;
        animation: string;
        position: 'center' | 'bottom' | 'top';
    };
}

export interface VoicePreset {
    id: string;
    name: string;
    tone: string;
    pacingMultiplier: number;
    emotion: string;
    rhythmRules: {
        maxSentenceLength: number;
        punchSentenceFrequency: number; // every X scenes
    };
}

export const visualPresets: Record<string, VisualPreset> = {
    'Cinematic_Dark_v1': {
        id: 'Cinematic_Dark_v1',
        name: 'Cinematic Dark',
        artDirection: 'moody cinematic film, ultra-realistic, detailed textures',
        lightingStyle: 'Low-key, dramatic chiaroscuro, volumetric fog',
        colorGrading: 'Teal and orange, deep shadows, high contrast',
        cameraMovement: 'Slow push-in, subtle gimbal movement',
        transitionStyle: 'Slow cross-fade',
        subtitleStyle: { font: 'Inter-Bold', color: '#ffcc00', animation: 'word-pop', position: 'center' },
    },
    'Modern_Bright_v1': {
        id: 'Modern_Bright_v1',
        name: 'Modern Bright',
        artDirection: 'clean minimalist aesthetic, high-key lighting, soft shadows',
        lightingStyle: 'Natural daylight, soft-box lighting',
        colorGrading: 'Vibrant, clean white balance, high saturation',
        cameraMovement: 'Static or fast pans',
        transitionStyle: 'Sharp cut, slide-right',
        subtitleStyle: { font: 'Outfit-Black', color: '#ffffff', animation: 'slide-up', position: 'bottom' },
    },
    'Documentary_Clean_v1': {
        id: 'Documentary_Clean_v1',
        name: 'Documentary Clean',
        artDirection: 'authentic handheld footage, neutral tones, professional documentary grain',
        lightingStyle: 'Available light, naturalistic',
        colorGrading: 'Flat, realistic, film stock emulation',
        cameraMovement: 'Natural handheld shake, slow zoom',
        transitionStyle: 'Straight cut',
        subtitleStyle: { font: 'Roboto-Medium', color: '#f0f0f0', animation: 'fade', position: 'bottom' },
    },
};

export const voicePresets: Record<string, VoicePreset> = {
    'Dramatic_Narrator': {
        id: 'Dramatic_Narrator',
        name: 'The Shadow',
        tone: 'Deep, serious, breathy',
        pacingMultiplier: 0.85,
        emotion: 'Gravely',
        rhythmRules: { maxSentenceLength: 12, punchSentenceFrequency: 2 },
    },
    'Energetic_Storyteller': {
        id: 'Energetic_Storyteller',
        name: 'The Hype',
        tone: 'Fast-paced, enthusiastic, rising intonation',
        pacingMultiplier: 1.15,
        emotion: 'Enthusiastic',
        rhythmRules: { maxSentenceLength: 8, punchSentenceFrequency: 1 },
    },
    'Calm_Educator': {
        id: 'Calm_Educator',
        name: 'The Sage',
        tone: 'Steady, authoritative, clear enunciation',
        pacingMultiplier: 1.0,
        emotion: 'Neutral',
        rhythmRules: { maxSentenceLength: 15, punchSentenceFrequency: 3 },
    },
};

export const getVisualPreset = (id: string): VisualPreset => {
    return visualPresets[id] || visualPresets['Modern_Bright_v1'];
};

export const getVoicePresetByEmotion = (emotion: string): VoicePreset => {
    if (emotion === 'Fear' || emotion === 'Urgency') return voicePresets['Dramatic_Narrator'];
    if (emotion === 'Inspiration' || emotion === 'Awe') return voicePresets['Energetic_Storyteller'];
    return voicePresets['Calm_Educator'];
};
