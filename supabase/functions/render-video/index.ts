import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { audioUrls, visualUrls, script, frameSize } = await req.json()

        if (!audioUrls || !visualUrls || visualUrls.length === 0) {
            throw new Error('Audio and Visuals are required')
        }

        const apiKey = Deno.env.get('SHOTSTACK_API_KEY')
        if (!apiKey) throw new Error('SHOTSTACK_API_KEY not configured')

        // Calculate resolution based on frameSize
        let resolution = 'sd';
        let width = 1024;
        let height = 576;

        if (frameSize === '16:9' || frameSize === 'landscape') {
            resolution = '1080';
            width = 1920;
            height = 1080;
        } else if (frameSize === '9:16' || frameSize === 'portrait') {
            resolution = '1080';
            width = 1080;
            height = 1920;
        } else if (frameSize === '1:1' || frameSize === 'square') {
            resolution = '1080';
            width = 1080;
            height = 1080;
        }

        // Construct Shotstack JSON Edit
        const videoClips = [];
        const audioTracks = [];
        let currentTime = 0;

        const scenes = script.scenes || [];

        // Build Video and Audio Tracks
        // We assume visualUrls and audioUrls match the scenes array order
        scenes.forEach((scene: any, index: number) => {
            const visualUrl = visualUrls[index];
            const audioUrl = audioUrls[index];
            const duration = scene.duration_seconds || 5;

            // Video Clip
            // If the visual is a video (mp4), use 'video' asset, else 'image'
            // We can detect based on extension or just assume video since we switched to Minimax
            // But let's be safe and check extension roughly
            const isVideo = visualUrl.toLowerCase().includes('.mp4');

            videoClips.push({
                asset: {
                    type: isVideo ? 'video' : 'image',
                    src: visualUrl,
                    volume: isVideo ? 0 : 1, // Mute generated video audio if any, we use ElevenLabs
                },
                start: currentTime,
                length: duration,
                transition: {
                    in: index === 0 ? 'fade' : (scene.transition || 'fade'),
                    out: 'fade'
                },
                fit: 'cover', // Ensure it covers the frame (important for mixing aspect ratios)
                scale: 1,
            });

            // Audio Clip
            if (audioUrl) {
                audioTracks.push({
                    asset: {
                        type: 'audio',
                        src: audioUrl,
                        volume: 1
                    },
                    start: currentTime,
                    // length: duration // Let audio play out naturally or trim? 
                    // Usually better to let voiceover finish. But for simple sync, we might not trim.
                    // If we don't specify length, it plays full asset.
                });
            }

            currentTime += duration;
        });

        const edit = {
            timeline: {
                background: "#000000",
                tracks: [
                    {
                        clips: videoClips // Top track (visuals)
                    },
                    {
                        clips: audioTracks // Bottom track (audio)
                    }
                ]
            },
            output: {
                format: 'mp4',
                resolution: resolution,
                size: {
                    width: width,
                    height: height
                }
            }
        }

        console.log("Sending edit to Shotstack:", JSON.stringify(edit).substring(0, 200) + "...");

        // 1. Submit to Shotstack
        const response = await fetch('https://api.shotstack.io/stage/render', { // Use 'stage' for dev/testing
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(edit),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error("Shotstack Error:", error);
            throw new Error(error.message || 'Failed to start render')
        }

        const data = await response.json()
        const renderId = data.response.id

        return new Response(JSON.stringify({
            message: 'Render started',
            renderId: renderId,
            statusUrl: `https://api.shotstack.io/stage/render/${renderId}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Render function error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
