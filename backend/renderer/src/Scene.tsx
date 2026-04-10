import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const Scene: React.FC<{ imageUrl: string; voiceoverText: string }> = ({ imageUrl, voiceoverText }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const scale = interpolate(frame, [0, 150], [1, 1.1]);

    return (
        <AbsoluteFill>
            <Img
                src={imageUrl}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `scale(${scale})`
                }}
            />

            {/* Subtitles Overlay */}
            <AbsoluteFill style={{
                justifyContent: 'flex-end',
                alignItems: 'center',
                paddingBottom: 200
            }}>
                <div style={{
                    fontSize: 80,
                    color: 'white',
                    fontWeight: 'bold',
                    textShadow: '0 0 10px rgba(0,0,0,0.5)',
                    textAlign: 'center',
                    padding: '0 50px',
                    fontFamily: 'sans-serif'
                }}>
                    {voiceoverText}
                </div>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
