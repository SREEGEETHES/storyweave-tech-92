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
        const { styleName, description, referenceVideoUrl } = await req.json()

        if (!styleName) throw new Error('Style Name is required')

        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiKey) throw new Error('OPENAI_API_KEY not configured')

        // Construct prompt for GPT-4 to extractor/generate style keywords
        // If we had frames, we would send them here. For now, we use the text description and style name
        // to hallucinate/infer a high-quality style profile which is better than nothing.
        // This is a "Text-to-Style" analyzer.

        const systemPrompt = `You are an expert film director and cinematographer. 
        Analyze the given style name, description, and (optional) video context to create a comprehensive visual style profile.
        
        Output JSON format:
        {
            "visual_prompt_suffix": "string (comma separated keywords to append to image prompts)",
            "lighting": "string (e.g. dramatic, soft, neon)",
            "camera": "string (e.g. handheld, wide angle, dolly)",
            "color_palette": "string (e.g. teal and orange, pastel, noir)",
            "mood": "string"
        }`

        const userPrompt = `Style Name: ${styleName}
        Description: ${description || "No description provided"}
        Reference Video: ${referenceVideoUrl ? "Provided" : "None"}
        
        Create a detailed style profile that ensures high-quality, consistent video generation.`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o', // Use GPT-4o for best reasoning
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Failed to analyze style')
        }

        const data = await response.json()
        const analysis = JSON.parse(data.choices[0].message.content)

        return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error("Style analysis error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
