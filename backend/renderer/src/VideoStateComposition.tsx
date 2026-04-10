import React from 'react';
import {
    AbsoluteFill,
    Audio,
    Img,
    Sequence,
    Video,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
} from 'remotion';

// ---------------------------------------------------------------------------
// Types  (mirrors VideoState in src/types/index.ts)
// ---------------------------------------------------------------------------

interface Caption {
    text: string;
    startFrame: number;
    endFrame: number;
}

interface Scene {
    id: string;
    startFrame: number;
    durationInFrames: number;
    transitionType?: 'fade' | 'slide' | 'none';
    visualType: 'image' | 'video' | 'gif';
    visualUrl: string;
    kenBurnsEffect?: boolean;
}

interface VideoStateInput {
    id: string;
    global: {
        fps: number;
        durationInFrames: number;
        width: number;
        height: number;
        backgroundColor?: string;
    };
    audio: {
        voiceoverUrl?: string;
        bgmUrl?: string;
        volumeBgm: number;
    };
    captions: Caption[];
    scenes: Scene[];
}

// ---------------------------------------------------------------------------
// GlobalCaptionOverlay
// Rendered OUTSIDE any Sequence so useCurrentFrame() returns the global frame.
// ---------------------------------------------------------------------------

const GlobalCaptionOverlay: React.FC<{ captions: Caption[] }> = ({ captions }) => {
    const frame = useCurrentFrame();
    const active = captions.find(c => frame >= c.startFrame && frame < c.endFrame);
    if (!active) return null;

    return (
        <AbsoluteFill
            style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 100,
                pointerEvents: 'none',
            }}
        >
            <div
                style={{
                    background: 'rgba(0, 0, 0, 0.65)',
                    borderRadius: 14,
                    padding: '14px 32px',
                    fontSize: 52,
                    color: '#ffffff',
                    fontWeight: 700,
                    textAlign: 'center',
                    maxWidth: '88%',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                    textShadow: '0 2px 12px rgba(0, 0, 0, 0.9)',
                    lineHeight: 1.3,
                }}
            >
                {active.text}
            </div>
        </AbsoluteFill>
    );
};

// ---------------------------------------------------------------------------
// SceneVisual
// Renders the visual (image / video / gif) with optional Ken Burns zoom.
// Fade transitions are applied via opacity interpolation.
// ---------------------------------------------------------------------------

const SceneVisual: React.FC<{ scene: Scene }> = ({ scene }) => {
    const frame = useCurrentFrame();
    const { durationInFrames } = scene;

    // Ken Burns: subtle scale 1.0 → 1.08 over the scene duration
    const scale = scene.kenBurnsEffect
        ? interpolate(frame, [0, durationInFrames], [1.0, 1.08], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
          })
        : 1;

    // Fade in / out (only when transitionType === 'fade')
    const fadeDuration = Math.min(12, Math.floor(durationInFrames / 6));
    const opacity =
        scene.transitionType === 'fade'
            ? interpolate(
                  frame,
                  [0, fadeDuration, durationInFrames - fadeDuration, durationInFrames],
                  [0, 1, 1, 0],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
              )
            : 1;

    // Slide in from right (only when transitionType === 'slide')
    const slideOffset =
        scene.transitionType === 'slide'
            ? interpolate(frame, [0, fadeDuration], [100, 0], {
                  extrapolateLeft: 'clamp',
                  extrapolateRight: 'clamp',
              })
            : 0;

    const containerStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        opacity,
        transform: `translateX(${slideOffset}%) scale(${scale})`,
        transformOrigin: 'center center',
        overflow: 'hidden',
    };

    const mediaStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    };

    return (
        <AbsoluteFill style={containerStyle}>
            {scene.visualType === 'video' ? (
                <Video src={scene.visualUrl} style={mediaStyle} />
            ) : (
                // image and gif both use <Img> — Remotion handles GIF frames
                <Img src={scene.visualUrl} style={mediaStyle} />
            )}
        </AbsoluteFill>
    );
};

// ---------------------------------------------------------------------------
// VideoStateComposition  (composition id: "StoryWeaveVideo")
// ---------------------------------------------------------------------------

export const VideoStateComposition: React.FC<{ videoState: VideoStateInput }> = ({
    videoState,
}) => {
    const { global: g, audio, scenes, captions } = videoState;

    return (
        <AbsoluteFill style={{ backgroundColor: g.backgroundColor ?? '#000000' }}>

            {/* ── Scene layers ─────────────────────────────────────────── */}
            {scenes.map(scene => (
                <Sequence
                    key={scene.id}
                    from={scene.startFrame}
                    durationInFrames={scene.durationInFrames}
                    layout="none"
                >
                    <SceneVisual scene={scene} />
                </Sequence>
            ))}

            {/* ── Global caption overlay (frame-accurate) ──────────────── */}
            {captions.length > 0 && (
                <GlobalCaptionOverlay captions={captions} />
            )}

            {/* ── Voiceover track ──────────────────────────────────────── */}
            {audio.voiceoverUrl && (
                <Audio src={audio.voiceoverUrl} volume={1} />
            )}

            {/* ── Background music ─────────────────────────────────────── */}
            {audio.bgmUrl && (
                <Audio src={audio.bgmUrl} volume={audio.volumeBgm ?? 0.3} />
            )}
        </AbsoluteFill>
    );
};
