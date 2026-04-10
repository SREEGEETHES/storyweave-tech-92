import React, { createContext, useContext, useState, ReactNode } from 'react';
import { VideoState } from '../types';

interface VideoContextData {
    videoState: VideoState | null;
    setVideoState: React.Dispatch<React.SetStateAction<VideoState | null>>;
    updateGlobal: (globalData: Partial<VideoState['global']>) => void;
}

const VideoStateContext = createContext<VideoContextData | undefined>(undefined);

export const VideoStateProvider = ({ children }: { children: ReactNode }) => {
    const [videoState, setVideoState] = useState<VideoState | null>({
        id: "temp-id",
        global: {
            fps: 30,
            durationInFrames: 300, // 10 seconds default
            width: 1080,
            height: 1920, // TikTok/Shorts vertical aspect
            backgroundColor: "#000000"
        },
        audio: {
            volumeBgm: 0.5
        },
        captions: [],
        scenes: []
    });

    const updateGlobal = (globalData: Partial<VideoState['global']>) => {
        setVideoState(prev => prev ? {
            ...prev,
            global: { ...prev.global, ...globalData }
        } : null);
    };

    return (
        <VideoStateContext.Provider value={{ videoState, setVideoState, updateGlobal }}>
            {children}
        </VideoStateContext.Provider>
    );
};

export const useVideoState = () => {
    const context = useContext(VideoStateContext);
    if (context === undefined) {
        throw new Error('useVideoState must be used within a VideoStateProvider');
    }
    return context;
};
