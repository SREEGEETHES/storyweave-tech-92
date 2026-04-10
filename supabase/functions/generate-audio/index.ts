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
        const { text, voiceId } = await req.json()
        const elevenKey = Deno.env.get('ELEVENLABS_API_KEY')

        if (!elevenKey) {
            throw new Error("Missing ELEVENLABS_API_KEY")
        }

        const voice_id = voiceId || "21m00Tcm4TlvDq8ikWAM" // Default Adam

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
            method: 'POST',
            headers: {
                'xi-api-key': elevenKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                model_id: "eleven_monolingual_v1",
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.5
                }
            }),
        })

        if (!response.ok) {
            const err = await response.json()
            throw new Error(err.detail?.message || "ElevenLabs Error")
        }

        // The response is an audio stream (binary). 
        // We need to upload this to Supabase Storage and return the URL.
        // Read the audio response as ArrayBuffer
        const arrayBuffer = await response.arrayBuffer()

        // Convert to Base64 Data URI so frontend can play it immediately
        // (Bypassing Storage for now to ensure instant "Real AI" verification)
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        const dataUri = `data:audio/mpeg;base64,${base64}`

        return new Response(JSON.stringify({
            url: dataUri, // Real generated audio!
            duration: text.length * 0.1 // Rough estimate, accurate duration requires decoding
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
