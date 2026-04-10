import React from 'react';
import { Composition } from 'remotion';
import { VideoComposition } from './Composition.jsx';
import { VideoStateComposition } from './VideoStateComposition.jsx';

// Default VideoState for Remotion Studio preview
const DEFAULT_VIDEO_STATE = {
    id: 'preview',
    global: {
        fps: 30,
        durationInFrames: 900,
        width: 1080,
        height: 1920,
        backgroundColor: '#000000',
    },
    audio: {
        volumeBgm: 0.3,
    },
    captions: [],
    scenes: [
        {
            id: 'scene_0',
            startFrame: 0,
            durationInFrames: 900,
            transitionType: 'fade' as const,
            visualType: 'image' as const,
            visualUrl: 'https://via.placeholder.com/1080x1920/111111/ffffff?text=StoryWeave',
            kenBurnsEffect: true,
        },
    ],
};

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {/* ── Legacy manifest-based composition ─────────────────────── */}
            <Composition
                id="Video"
                component={VideoComposition}
                durationInFrames={1800}
                fps={30}
                width={1080}
                height={1920}
                defaultProps={{
                    manifest: {
                        scenes: [
                            {
                                imageUrl: 'https://via.placeholder.com/1080x1920',
                                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                                voiceoverText: 'Welcome to StoryWeave.',
                                duration: 5,
                            },
                        ],
                        aspectRatio: '9:16',
                    },
                }}
            />

            {/* ── VideoState-driven composition (used by all Lambda renders) */}
            <Composition
                id="StoryWeaveVideo"
                component={VideoStateComposition}
                // calculateMetadata derives fps / dimensions from the inputProps
                // so these static values are just the Remotion Studio defaults.
                durationInFrames={DEFAULT_VIDEO_STATE.global.durationInFrames}
                fps={DEFAULT_VIDEO_STATE.global.fps}
                width={DEFAULT_VIDEO_STATE.global.width}
                height={DEFAULT_VIDEO_STATE.global.height}
                calculateMetadata={({ props }) => {
                    const vs = (props as any).videoState;
                    return {
                        durationInFrames: vs?.global?.durationInFrames ?? 900,
                        fps:              vs?.global?.fps              ?? 30,
                        width:            vs?.global?.width            ?? 1080,
                        height:           vs?.global?.height           ?? 1920,
                    };
                }}
                defaultProps={{ videoState: DEFAULT_VIDEO_STATE }}
            />
        </>
    );
};
