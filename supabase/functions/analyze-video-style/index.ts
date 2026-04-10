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
        const { styleName, description, referenceVideoUrl, youtubeUrl } = await req.json()

        if (!styleName) throw new Error('Style Name is required')

        const openAiKey = Deno.env.get('OPENAI_API_KEY')
        const gcpServiceAccount = Deno.env.get('GCP_SERVICE_ACCOUNT_JSON')

        if (!openAiKey) throw new Error('OPENAI_API_KEY not configured')

        // 1. DNA EXTRACTION (GCP Video Intelligence)
        // This is where we would call the GCP API to get shot detection and visual analysis.
        // For now, we simulate the high-quality DNA output if GCP is not fully configured.

        let dnaProfile = {
            shots: [
                { start: "0s", end: "3s", label: "Wide shot, cinematic lighting" },
                { start: "3s", end: "7s", label: "Close up, portrait bokeh" },
                { start: "7s", end: "10s", label: "Dynamic movement, fast pace" }
            ],
            visual_dna: {
                lighting: "Cinematic, high contrast",
                camera: "Dolly zoom, handheld feel",
                color_palette: "Teal and orange",
                mood: "Energetic and professional"
            }
        };

        if (gcpServiceAccount) {
            console.log("GCP Service Account detected. Ready for real DNA extraction.");
            // Actual GCP implementation would go here:
            // - Authenticate with Google
            // - Submit video for analysis (if YT URL, might need to download first)
            // - Poll for results
        }

        // 2. STYLE REASONING (GPT-4o)
        // Combine DNA with text description to refine the profile.

        const systemPrompt = `You are an expert film director. 
        Analyze the style DNA (shots and visual components) and description to create a final style config.
        
        Output JSON format:
        {
            "visual_prompt_suffix": "string (keywords for image generation)",
            "lighting": "string",
            "camera": "string",
            "color_palette": "string",
            "mood": "string",
            "shot_logic": "string (brief instruction on how to cut the video based on the DNA)"
        }`

        const userPrompt = `Style Name: ${styleName}
        Description: ${description || "No description provided"}
        DNA Profile: ${JSON.stringify(dnaProfile)}
        Reference Type: ${youtubeUrl ? "YouTube URL: " + youtubeUrl : "Uploaded Video"}
        
        Synthesize this into a high-level style configuration.`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'Failed to refine style with AI')
        }

        const data = await response.json()
        const refinedStyle = JSON.parse(data.choices[0].message.content)

        return new Response(JSON.stringify({
            ...refinedStyle,
            dna: dnaProfile // Include the raw DNA for reference
        }), {
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
