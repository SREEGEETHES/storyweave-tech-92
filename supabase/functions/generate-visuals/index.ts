/**
 * Edge Function: generate-visuals
 * ---------------------------------
 * Generates a scene image via Seedream 5.0 Lite running on the GPU server.
 * Called by the frontend aiService.generateVideoSegment().
 *
 * Request body:  { prompt: string, frameSize?: '16:9' | '9:16' | '1:1', steps?: number, seed?: number }
 * Response body: { url: string }
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
        const { prompt, frameSize = '16:9', steps = 30, seed } = await req.json()

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            throw new Error('prompt is required and must be a non-empty string')
        }

        // Map aspect ratio to pixel dimensions (Seedream supports arbitrary sizes)
        let width = 1920, height = 1080
        if (frameSize === '9:16' || frameSize === 'portrait') {
            width = 1080; height = 1920
        } else if (frameSize === '1:1' || frameSize === 'square') {
            width = 1080; height = 1080
        }

        const gpuServerUrl = Deno.env.get('GPU_SERVER_URL')
        const gpuApiKey    = Deno.env.get('GPU_SERVER_API_KEY') ?? ''

        if (!gpuServerUrl) {
            throw new Error('GPU_SERVER_URL environment variable is not set')
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (gpuApiKey) headers['X-API-Key'] = gpuApiKey

        const body: Record<string, unknown> = {
            prompt: prompt.trim(),
            width,
            height,
            steps,
            negative_prompt: 'blurry, low quality, distorted, watermark, text, logo, nsfw',
        }
        if (seed !== undefined) body['seed'] = seed

        const response = await fetch(`${gpuServerUrl}/image/generate`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(`GPU server Seedream error ${response.status}: ${errorBody}`)
        }

        const data: { image_url: string } = await response.json()

        return new Response(
            JSON.stringify({ url: data.image_url }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
