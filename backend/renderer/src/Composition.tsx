import { AbsoluteFill, Series, Audio, Img } from 'remotion';
import { Scene } from './Scene.jsx';

export interface RenderManifest {
    scenes: {
        imageUrl: string;
        audioUrl: string;
        voiceoverText: string;
        duration: number;
    }[];
    aspectRatio: '16:9' | '9:16' | '1:1';
}

export const VideoComposition: React.FC<{ manifest: RenderManifest }> = ({ manifest }) => {
    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            <Series>
                {manifest.scenes.map((scene, index) => (
                    <Series.Sequence key={index} durationInFrames={scene.duration * 30}>
                        <Scene
                            imageUrl={scene.imageUrl}
                            voiceoverText={scene.voiceoverText}
                        />
                        <Audio src={scene.audioUrl} />
                    </Series.Sequence>
                ))}
            </Series>
        </AbsoluteFill>
    );
};
