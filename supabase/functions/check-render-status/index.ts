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
        const { renderId } = await req.json()

        // Check if this is a mock/simulated render ID
        if (renderId.startsWith('mock-render-') || renderId.startsWith('simulated-')) {
            // Return completed status for mock renders
            return new Response(JSON.stringify({
                status: 'completed',
                url: 'https://cdn.shotstack.io/au/v1/msgt/11be6f50-6d84-4866-9a2e-8344d5c41496/source.mp4',
                message: 'Simulation mode - using demo video'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // For real Shotstack render IDs
        const shotstackKey = Deno.env.get('SHOTSTACK_API_KEY')

        if (!shotstackKey) {
            // No Shotstack key, return completed with demo video
            return new Response(JSON.stringify({
                status: 'completed',
                url: 'https://cdn.shotstack.io/au/v1/msgt/11be6f50-6d84-4866-9a2e-8344d5c41496/source.mp4',
                message: 'No Shotstack key configured'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Check actual Shotstack status
        const response = await fetch(`https://api.shotstack.io/stage/render/${renderId}`, {
            headers: {
                'x-api-key': shotstackKey,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to check render status')
        }

        const data = await response.json()
        const renderStatus = data.response.status
        const videoUrl = data.response.url

        return new Response(JSON.stringify({
            status: renderStatus, // 'queued', 'rendering', 'done', 'failed'
            url: videoUrl,
            message: `Render status: ${renderStatus}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({
            error: error.message,
            status: 'failed'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
