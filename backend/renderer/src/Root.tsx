import { Composition } from 'remotion';
import { VideoComposition } from './Composition.jsx';

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="Video"
                component={VideoComposition}
                durationInFrames={1800} // 60 seconds at 30fps
                fps={30}
                width={1080}
                height={1920} // Shorts format by default
                defaultProps={{
                    manifest: {
                        scenes: [
                            {
                                imageUrl: 'https://via.placeholder.com/1080x1920',
                                audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
                                voiceoverText: 'Welcome to Antigravity.',
                                duration: 5,
                            }
                        ],
                        aspectRatio: '9:16'
                    }
                }}
            />
        </>
    );
};
