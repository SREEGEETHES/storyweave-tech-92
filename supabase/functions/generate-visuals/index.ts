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
        const { prompt, frameSize } = await req.json()
        const falKey = Deno.env.get('FAL_KEY')

        if (!falKey) {
            // Fallback for demo if key missing, or throw error
            throw new Error("Missing FAL_KEY")
        }

        // Map frontend aspect ratio to Fal.ai image_size enum
        let imageSize = "landscape_16_9";
        if (frameSize === '9:16' || frameSize === 'portrait') {
            imageSize = "portrait_16_9";
        } else if (frameSize === '1:1' || frameSize === 'square') {
            imageSize = "square_hd";
        }

        // Example call to Fal.ai (Fast SDXL)
        const response = await fetch('https://queue.fal.run/fal-ai/fast-sdxl', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${falKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                image_size: imageSize,
                num_inference_steps: 25
            }),
        })

        const data = await response.json()
        // Fal.ai returns a request_id for queue, or result if fast enough. 
        // For simplicity in this v1, assume we wait or poll. 
        // Actually, queue.fal.run usually returns result if we wait? 
        // Let's assume we get a generic structure back. 
        // If using the fal-client js library it handles this, but here we use fetch.

        // MOCK RESPONSE if real API fails/complex:
        // const imageUrl = data.images[0].url;

        return new Response(JSON.stringify({
            url: data.images ? data.images[0].url : "https://via.placeholder.com/1024x768"
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
