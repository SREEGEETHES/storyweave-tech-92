/**
 * StoryWeave DNA — YouTube Process Route
 *
 * POST /dna/yt-process
 * Accepts a YouTube URL, extracts 5 keyframes, sends to Kimi K2.5 for analysis.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import ytdl from 'ytdl-core';
import fluentFfmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import dotenv from 'dotenv';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

dotenv.config();

const YT_PROCESS_SCHEMA = z.object({
    youtubeUrl: z.string().url({ message: "Invalid URL format" }),
    title: z.string().optional(),
});

// Validate YouTube URL helper
function isValidYouTubeUrl(url: string): boolean {
    const ytPatterns = [
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/,
        /^https?:\/\/youtu\.be\//,
        /^https?:\/\/(www\.)?youtube\.com\/shorts\//,
    ];
    return ytPatterns.some(pattern => pattern.test(url));
}

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function extractKeyframes(videoUrl: string, count: number = 5): Promise<string[]> {
    const tempMp4 = join(tmpdir(), `yt_dna_${Date.now()}.mp4`);
    const outputDir = join(tmpdir(), `yt_frames_${Date.now()}`);
    const fs = await import('fs');
    fs.mkdirSync(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
        const frames: string[] = [];
        
        const stream = ytdl(videoUrl, { quality: 'highest' });
        const fileStream = createWriteStream(tempMp4);
        
        stream.pipe(fileStream);
        
        stream.on('end', async () => {
            try {
                const duration = await getVideoDuration(tempMp4);
                const interval = duration / (count + 1);
                
                const framePromises = [];
                for (let i = 1; i <= count; i++) {
                    const timestamp = interval * i;
                    const framePath = join(outputDir, `frame_${i}.jpg`);
                    framePromises.push(extractFrame(tempMp4, timestamp, framePath));
                }
                
                const extracted = await Promise.all(framePromises);
                
                for (const framePath of extracted) {
                    const base64 = fs.readFileSync(framePath, 'base64');
                    frames.push(base64);
                }
                
                fs.rmSync(tempMp4, { force: true });
                fs.rmSync(outputDir, { recursive: true, force: true });
                
                resolve(frames);
            } catch (err) {
                reject(err);
            }
        });
        
        stream.on('error', reject);
    });
}

function getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
        fluentFfmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) reject(err);
            else resolve(metadata.format.duration || 60);
        });
    });
}

function extractFrame(inputPath: string, timestamp: number, outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fluentFfmpeg(inputPath)
            .seek(timestamp)
            .frames(1)
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', reject)
            .run();
    });
}

async function analyzeWithKim(frameBase64Array: string[]): Promise<any> {
    if (!NVIDIA_API_KEY) throw new Error('NVIDIA_API_KEY not configured');
    
    const images = frameBase64Array.map(b64 => ({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${b64}` }
    }));
    
    const prompt = `Analyze these 5 sequential frames from a YouTube video. For each frame, describe: 
1. Visual style (colors, lighting, composition)
2. Typography and text overlays
3. Motion/transition patterns
4. Audio-visual sync patterns
5. Editing rhythm and pacing

Return a JSON object with "dna" field containing an array of 5 objects, each with frame-level analysis.`;
    
    const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
            model: 'nvidia/kimi-k2.5',
            messages: [
                { role: 'user', content: [{ type: 'text', text: prompt }, ...images] }
            ],
            max_tokens: 2048,
            temperature: 0.2,
        },
        {
            headers: {
                'Authorization': `Bearer ${NVIDIA_API_KEY}`,
                'Content-Type': 'application/json',
            },
        }
    );
    
    return response.data;
}

function getSupabase() {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    }
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export const dnaRoutes = async (fastify: FastifyInstance) => {
    
    fastify.post('/yt-process', { preValidation: [fastify.authenticate] }, async (request: any, reply) => {
        const parsed = YT_PROCESS_SCHEMA.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
        }
        
        const { youtubeUrl, title } = parsed.data;
        
        // Validate YouTube URL format
        if (!isValidYouTubeUrl(youtubeUrl)) {
            return reply.status(400).send({ 
                error: 'Invalid YouTube URL', 
                message: 'Please provide a valid YouTube URL (youtube.com/watch?v= or youtu.be or youtube.com/shorts)' 
            });
        }
        
        const userId = request.user.id;
        
        try {
            reply.raw.on('close', () => {});
            
            const info = await ytdl.getInfo(youtubeUrl);
            const videoTitle = title || info.videoDetails.title;
            const duration = parseInt(info.videoDetails.lengthSeconds || '60');
            
            const frameCount = Math.min(5, Math.max(1, Math.floor(duration / 30)));
            
            const frames = await extractKeyframes(youtubeUrl, frameCount);
            
            const analysis = await analyzeWithKim(frames);
            
            const dnaContent = analysis.choices?.[0]?.message?.content || 
                             JSON.stringify({ frames, analysis: 'extracted frames' });
            
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('video_dna')
                .insert({
                    user_id: userId,
                    source_url: youtubeUrl,
                    source_type: 'youtube',
                    title: videoTitle,
                    dna: dnaContent,
                    frame_count: frameCount,
                })
                .select()
                .single();
            
            if (error) throw error;
            
            return {
                success: true,
                dna_id: data.id,
                title: videoTitle,
                frame_count: frameCount,
                dna: dnaContent,
            };
            
        } catch (err: any) {
            return reply.status(500).send({ error: err.message || 'YouTube processing failed' });
        }
    });
    
    fastify.get('/yt-analyze', { preValidation: [fastify.authenticate] }, async (request: any) => {
        const userId = request.user.id;
        const supabase = getSupabase();
        
        const { data, error } = await supabase
            .from('video_dna')
            .select('*')
            .eq('user_id', userId)
            .eq('source_type', 'youtube')
            .order('created_at', { ascending: false })
            .limit(20);
        
        if (error) throw error;
        return data;
    });
};