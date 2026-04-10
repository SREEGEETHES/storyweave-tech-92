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
        const { idea, duration, tone, style } = await req.json()
        const openAiKey = Deno.env.get('OPENAI_API_KEY')

        if (!openAiKey) {
            throw new Error('Missing OPENAI_API_KEY')
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a viral script writer for TikTok/Shorts. Generate a 3-part script (Intro, Body, Outro) for the video.
                        
                        Parameters:
                        - Duration: ${duration || '30s'}
                        - Tone: ${tone || 'Engaging'}
                        - Style: ${style || 'General'}
                        
                        Return ONLY a JSON array with 3 objects, each with these exact fields:
                        [
                          {
                            "visual_prompt": "detailed image generation prompt for this scene",
                            "voiceover": "the narration text (under 15 words)",
                            "duration_seconds": 5
                          }
                        ]
                        
                        Make the visual_prompt match the "${style}" style. Keep voiceover concise and engaging.`
                    },
                    {
                        role: 'user',
                        content: `Idea: ${idea}`
                    }
                ],
            }),
        })

        const data = await response.json()
        const generatedContent = data.choices[0].message.content

        // Basic parsing logic (assuming GPT returns JSON string or we parse it)
        // For robustness, we'd force JSON mode, but for this demo let's assume valid text or try-catch parse
        let segments;
        try {
            // Strip markdown code blocks if present (common GPT behavior)
            const cleanContent = generatedContent.replace(/```json\n?|```/g, '').trim();
            segments = JSON.parse(cleanContent);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback if not pure JSON
            segments = [
                {
                    visual_prompt: `Cinematic shot of ${idea}`,
                    voiceover: generatedContent.substring(0, 100),
                    duration_seconds: 5
                }
            ]
        }

        return new Response(JSON.stringify({ scenes: segments }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
