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
        const { text, voiceId } = await req.json()

        if (!text) throw new Error('Text is required')

        const apiKey = Deno.env.get('ELEVEN_LABS_API_KEY')
        if (!apiKey) throw new Error('ELEVEN_LABS_API_KEY not configured')

        // 1. Generate Audio
        const voice_id = voiceId || '21m00Tcm4TlvDq8ikWAM' // Default voice (Rachel)
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
            method: 'POST',
            headers: {
                'xi-api-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: { stability: 0.5, similarity_boost: 0.5 }
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.detail?.message || 'Failed to generate voice')
        }

        const audioArrayBuffer = await response.arrayBuffer()

        // 2. Upload to Supabase Storage
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const fileName = `audio/${crypto.randomUUID()}.mp3`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assets')
            .upload(fileName, audioArrayBuffer, {
                contentType: 'audio/mpeg',
                upsert: false
            })

        if (uploadError) throw uploadError

        // 3. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(fileName)

        return new Response(JSON.stringify({ audioUrl: publicUrl }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
