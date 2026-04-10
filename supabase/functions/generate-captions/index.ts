/**
 * Edge Function: generate-captions
 * ---------------------------------
 * Transcribes an audio file via Whisper (faster-whisper large-v3)
 * running on the GPU server and returns frame-aligned caption segments.
 *
 * Segments map directly to VideoState.captions[]:
 *   { text: string, startFrame: number, endFrame: number }
 *
 * Request body:
 *   {
 *     audioUrl:  string  — public S3/CDN URL of the voiceover audio
 *     language?: string  — BCP-47 code, default 'en'. Use 'auto' to detect.
 *     fps?:      number  — frames per second of the video, default 30
 *   }
 *
 * Response body:
 *   {
 *     captions: Array<{ text: string, startFrame: number, endFrame: number }>,
 *     fullText: string
 *   }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CaptionSegment {
    text: string
    startFrame: number
    endFrame: number
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { audioUrl, language = 'en', fps = 30 } = await req.json()

        if (!audioUrl || typeof audioUrl !== 'string') {
            throw new Error('audioUrl is required')
        }
        if (typeof fps !== 'number' || fps < 1 || fps > 120) {
            throw new Error('fps must be a number between 1 and 120')
        }

        const gpuServerUrl = Deno.env.get('GPU_SERVER_URL')
        const gpuApiKey    = Deno.env.get('GPU_SERVER_API_KEY') ?? ''

        if (!gpuServerUrl) {
            throw new Error('GPU_SERVER_URL environment variable is not set')
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (gpuApiKey) headers['X-API-Key'] = gpuApiKey

        const response = await fetch(`${gpuServerUrl}/transcribe`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ audio_url: audioUrl, language, fps }),
        })

        if (!response.ok) {
            const errorBody = await response.text()
            throw new Error(`GPU server Whisper error ${response.status}: ${errorBody}`)
        }

        const data: {
            segments: Array<{ text: string; start_frame: number; end_frame: number }>
            full_text: string
        } = await response.json()

        // Normalise snake_case GPU response → camelCase VideoState shape
        const captions: CaptionSegment[] = data.segments.map(seg => ({
            text: seg.text,
            startFrame: seg.start_frame,
            endFrame: seg.end_frame,
        }))

        return new Response(
            JSON.stringify({ captions, fullText: data.full_text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
