import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { VideoState } from '../types';
import { supabase } from '@/integrations/supabase/client';

const generateId = () => crypto.randomUUID();

interface VideoContextData {
    videoState: VideoState | null;
    setVideoState: React.Dispatch<React.SetStateAction<VideoState | null>>;
    updateGlobal: (globalData: Partial<VideoState['global']>) => void;
    saveVideoState: (projectId?: string) => Promise<string | null>;
    loadVideoState: (projectId: string) => Promise<boolean>;
    createNewVideoState: (title?: string) => string;
    isSaving: boolean;
    hasUnsavedChanges: boolean;
}

const VideoStateContext = createContext<VideoContextData | undefined>(undefined);

export const VideoStateProvider = ({ children }: { children: ReactNode }) => {
    const [videoState, setVideoState] = useState<VideoState | null>({
        id: generateId(),
        global: {
            fps: 30,
            durationInFrames: 300,
            width: 1080,
            height: 1920,
            backgroundColor: "#000000"
        },
        audio: {
            volumeBgm: 0.5
        },
        captions: [],
        scenes: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const updateGlobal = useCallback((globalData: Partial<VideoState['global']>) => {
        setVideoState(prev => prev ? {
            ...prev,
            global: { ...prev.global, ...globalData }
        } : null);
        setHasUnsavedChanges(true);
    }, []);

    const createNewVideoState = useCallback((title?: string): string => {
        const newId = generateId();
        const newState: VideoState = {
            id: newId,
            global: {
                fps: 30,
                durationInFrames: 300,
                width: 1080,
                height: 1920,
                backgroundColor: "#000000"
            },
            audio: {
                volumeBgm: 0.5
            },
            captions: [],
            scenes: []
        };
        setVideoState(newState);
        setHasUnsavedChanges(true);
        return newId;
    }, []);

    const saveVideoState = useCallback(async (projectId?: string): Promise<string | null> => {
        if (!videoState) return null;
        
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn('No user logged in, saving locally only');
                setHasUnsavedChanges(false);
                return videoState.id;
            }

            const videoData = {
                id: projectId || videoState.id,
                user_id: user.id,
                video_state: videoState,
                status: 'draft',
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('generations')
                .upsert([videoData], { onConflict: 'id' });

            if (error) {
                console.error('Error saving video state:', error);
                return null;
            }

            setHasUnsavedChanges(false);
            return videoState.id;
        } catch (err) {
            console.error('Save error:', err);
            return null;
        } finally {
            setIsSaving(false);
        }
    }, [videoState]);

    const loadVideoState = useCallback(async (projectId: string): Promise<boolean> => {
        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('generations')
                .select('video_state')
                .eq('id', projectId)
                .single();

            if (error || !data?.video_state) {
                console.error('Error loading video state:', error);
                return false;
            }

            setVideoState(data.video_state as VideoState);
            setHasUnsavedChanges(false);
            return true;
        } catch (err) {
            console.error('Load error:', err);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, []);

    return (
        <VideoStateContext.Provider value={{ 
            videoState, 
            setVideoState, 
            updateGlobal,
            saveVideoState,
            loadVideoState,
            createNewVideoState,
            isSaving,
            hasUnsavedChanges
        }}>
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
