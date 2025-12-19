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
        const { renderId } = await req.json()

        if (!renderId) {
            throw new Error('renderId is required')
        }

        const apiKey = Deno.env.get('SHOTSTACK_API_KEY')
        if (!apiKey) {
            throw new Error('SHOTSTACK_API_KEY not configured')
        }

        // 1. Check Shotstack render status
        const response = await fetch(
            `https://api.shotstack.io/stage/render/${renderId}`,
            {
                headers: {
                    'x-api-key': apiKey,
                    'Content-Type': 'application/json'
                }
            }
        )

        if (!response.ok) {
            throw new Error(`Shotstack API error: ${response.statusText}`)
        }

        const data = await response.json()
        const renderStatus = data.response.status
        const renderUrl = data.response.url

        // 2. Update database if render is complete
        if (renderStatus === 'done' && renderUrl) {
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            const { error: updateError } = await supabase
                .from('generations')
                .update({
                    status: 'completed',
                    video_url: renderUrl,
                    completed_at: new Date().toISOString()
                })
                .eq('render_id', renderId)

            if (updateError) {
                console.error('Database update error:', updateError)
                throw updateError
            }

            return new Response(JSON.stringify({
                status: 'completed',
                video_url: renderUrl,
                message: 'Video render completed successfully'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        } else if (renderStatus === 'failed') {
            // Update database with failed status
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )

            await supabase
                .from('generations')
                .update({
                    status: 'failed',
                    error_message: data.response.error || 'Render failed',
                    completed_at: new Date().toISOString()
                })
                .eq('render_id', renderId)

            return new Response(JSON.stringify({
                status: 'failed',
                error: data.response.error || 'Render failed'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        } else {
            // Still processing
            return new Response(JSON.stringify({
                status: renderStatus,
                message: 'Render still in progress'
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

    } catch (error) {
        console.error('Check render status error:', error)
        return new Response(JSON.stringify({
            error: error.message,
            details: 'Failed to check render status'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
