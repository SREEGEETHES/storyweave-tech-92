/**
 * Edge Function: generate-bgm
 * ----------------------------
 * Generates background music via ACE-Step 1.5 running on the GPU server.
 * Called by the frontend aiService.generateBGM().
 *
 * Request body:
 *   {
 *     prompt:   string   — music description
 *     duration: number   — desired length in seconds (default: 30)
 *     bpm?:     number   — beats per minute (default: 120)
 *     genre?:   string   — e.g. 'cinematic', 'ambient', 'hip-hop'
 *     mood?:    string   — e.g. 'energetic', 'calm', 'dramatic'
 *   }
 *
 * Response body: { url: string, duration: number }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const {
            prompt,
            duration = 30,
            bpm = 120,
            genre = 'cinematic',
            mood = 'neutral',
        } = await req.json()

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new Error('prompt is required and must be a non-empty string')
        }
        if (typeof duration !== 'number' || duration < 5 || duration > 300) {
            throw new Error('duration must be a number between 5 and 300 seconds')
        }

        const gpuServerUrl = Deno.env.get('GPU_SERVER_URL')
        const gpuApiKey    = Deno.env.get('GPU_SERVER_API_KEY') ?? ''

        if (!gpuServerUrl) {
            throw new Error('GPU_SERVER_URL environment variable is not set')
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (gpuApiKey) headers['X-API-Key'] = gpuApiKey

        const response = await fetch(`${gpuServerUrl}/bgm/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ prompt: prompt.trim(), duration, bpm, genre, mood }),
            // BGM generation can be slow — Supabase edge timeout is 150s by default;
            // set the GPU server's ACE-Step timeout on the server side.
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(`GPU server BGM error ${response.status}: ${errorBody}`)
        }

        const data: { audio_url: string; duration_seconds: number } = await response.json()

        return new Response(
            JSON.stringify({ url: data.audio_url, duration: data.duration_seconds }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
