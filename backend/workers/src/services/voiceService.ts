import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.ELEVENLABS_API_KEY;

export const generateVoiceover = async (text: string, voiceId: string = 'adam'): Promise<string> => {
    // TODO: Implement actual ElevenLabs API call
    console.log(`Generating voiceover for text: ${text}`);

    // Simulation for now
    return `https://audio.example.com/vo_${Math.random().toString(36).substr(2, 9)}.mp3`;

    /*
    const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      text,
      model_id: 'eleven_monolingual_v1',
    }, {
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
      responseType: 'arraybuffer'
    });
    // TODO: Save to S3 and return URL
    return 's3://bucket/audio.mp3';
    */
};
