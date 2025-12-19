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
        const { prompt, model, frameSize } = await req.json()

        if (!prompt) throw new Error('Prompt is required')

        const apiKey = Deno.env.get('FAL_KEY')
        if (!apiKey) throw new Error('FAL_KEY not configured')

        // Use Minimax Video-01 for high quality video generation
        // This validates the user's request for "best quality" video
        const falModel = "fal-ai/minimax-video" // Use base endpoint which supports text-to-video

        // Map frameSize to aspect_ratio
        let aspectRatio = "16:9"; // Default
        if (frameSize === "9:16" || frameSize === "portrait") aspectRatio = "9:16";
        if (frameSize === "1:1" || frameSize === "square") aspectRatio = "1:1";

        console.log(`Generating video with prompt: ${prompt.substring(0, 50)}...`);
        console.log(`Model: ${falModel}, Aspect Ratio: ${aspectRatio}`);

        // 1. Submit Generation Request to Fal.ai
        const response = await fetch(`https://queue.fal.run/${falModel}`, {
            method: 'POST',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                aspect_ratio: aspectRatio,
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            console.error("Fal.ai error:", error);
            throw new Error(error.detail || 'Failed to start generation')
        }

        const result = await response.json()
        let videoUrl = ''

        // Handle Fal.ai queue handling
        if (result.video && result.video.url) {
            videoUrl = result.video.url
        } else if (result.request_id) {
            // Poll for result
            const requestId = result.request_id
            let status = 'IN_QUEUE'
            console.log(`Polling for request: ${requestId}`);

            // Poll for up to 5 minutes (video generation takes longer)
            const maxPolls = 60;
            let pollCount = 0;

            while ((status === 'IN_QUEUE' || status === 'IN_PROGRESS') && pollCount < maxPolls) {
                await new Promise(r => setTimeout(r, 5000)) // Poll every 5 seconds
                pollCount++;

                const statusRes = await fetch(`https://queue.fal.run/requests/${requestId}/status`, {
                    headers: { 'Authorization': `Key ${apiKey}` }
                })
                const statusData = await statusRes.json()
                status = statusData.status
                console.log(`Status: ${status}`);

                if (status === 'COMPLETED') {
                    const resultRes = await fetch(`https://queue.fal.run/requests/${requestId}`, {
                        headers: { 'Authorization': `Key ${apiKey}` }
                    })
                    const resultData = await resultRes.json()
                    // Minimax sometimes returns 'video' object or just result
                    if (resultData.video) {
                        videoUrl = resultData.video.url;
                    } else if (resultData.images && resultData.images[0]) {
                        // Fallback if model fallback happened (unlikely for minimax)
                        videoUrl = resultData.images[0].url;
                    }
                } else if (status === 'FAILED') {
                    throw new Error('Fal.ai generation failed: ' + (statusData.error || 'Unknown error'))
                }
            }
        }

        if (!videoUrl) throw new Error('No video URL returned after polling')

        console.log("Video generated:", videoUrl);

        // 2. Download and Upload to Supabase Storage
        // For videos, we download the MP4 and upload it
        const videoResponse = await fetch(videoUrl)
        const videoBlob = await videoResponse.blob()

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const fileName = `visuals/${crypto.randomUUID()}.mp4`
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('assets')
            .upload(fileName, videoBlob, {
                contentType: 'video/mp4',
                upsert: false
            })

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(fileName)

        return new Response(JSON.stringify({ imageUrl: publicUrl }), { // Keep key as imageUrl for compatibility with existing frontend/render logic for now, or update it? Let's keep it but knowing it's a video
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Error in generate-visuals:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
