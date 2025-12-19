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

        // 1. Validate Input
        if (!idea) {
            throw new Error('Idea is required')
        }

        // 2. Call OpenAI to generate script with enhanced prompt
        const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
        if (!openAiApiKey) {
            throw new Error('OpenAI API Key not configured')
        }

        // Parse duration to get number of seconds
        const durationValue = duration || '30s'
        const durationSeconds = parseInt(durationValue.replace('s', ''))
        const sceneDuration = Math.floor(durationSeconds / 3) // Aim for 3-4 scenes

        // Style-specific instructions
        let styleGuide = "Use photorealistic descriptions with natural lighting."
        let styleName = style || 'Realistic'

        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(style);

        if (isUUID) {
            // Fetch custom style from database
            const supabase = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )
            const { data: styleData, error: styleError } = await supabase
                .from('styles')
                .select('name, description, config')
                .eq('id', style)
                .single()

            if (!styleError && styleData) {
                styleName = styleData.name
                const config = styleData.config || {}
                // Build style guide from analyzing module output
                styleGuide = `
                Style Name: ${styleData.name}
                Description: ${styleData.description}
                Mood: ${config.mood || 'Not specified'}
                Lighting: ${config.lighting || 'Not specified'}
                Camera: ${config.camera || 'Not specified'}
                Color Palette: ${config.color_palette || 'Not specified'}
                Keywords: ${config.visual_prompt_suffix || ''}
                
                CRITICAL INSTRUCTION: You MUST incorporate these specific style elements into EVERY visual prompt.`
            }
        } else {
            const styleInstructions = {
                realistic: "Use photorealistic descriptions with natural lighting, real-world settings, and authentic details. Camera angles should be documentary-style.",
                cinematic: "Use dramatic lighting (golden hour, rim lighting), wide establishing shots, close-ups for emotion, and Hollywood-style composition. Include camera movements like 'slow zoom', 'tracking shot', 'crane shot'.",
                animated: "Use vibrant colors, exaggerated features, smooth motion blur, and cartoon-style lighting. Specify '3D animated style' or '2D hand-drawn style'.",
                artistic: "Use creative interpretations, unusual perspectives, painterly effects, and artistic lighting. Reference art styles like 'impressionist', 'surreal', 'abstract'.",
                cartoon: "Use bold outlines, bright colors, simplified shapes, and playful compositions. Specify 'cartoon illustration style' with exaggerated expressions.",
            }
            styleGuide = styleInstructions[style as keyof typeof styleInstructions] || styleInstructions.realistic
        }

        const prompt = `You are an expert video director and scriptwriter specializing in ${styleName} video production.
        
        USER REQUEST:
        - Idea: ${idea}
        - Duration: ${durationValue} (${durationSeconds} seconds total)
        - Tone: ${tone || 'Professional'}
        - Visual Style: ${styleName}
        
        YOUR TASK:
        Create a compelling ${durationSeconds}-second video script broken into 3-4 scenes.
        
        VISUAL STYLE GUIDE:
        ${styleGuide}

REQUIREMENTS FOR EACH SCENE:
1. **visual_prompt**: Write a HIGHLY DETAILED prompt for an AI image generator (Flux Pro). Include:
   - Specific camera angle (e.g., "wide establishing shot", "close-up", "aerial view", "over-the-shoulder")
   - Lighting details (e.g., "golden hour sunlight", "dramatic side lighting", "soft diffused light")
   - Visual style matching "${style || 'realistic'}" aesthetic
   - Key elements and composition
   - Mood and atmosphere
   - Make it 2-3 sentences minimum!

2. **voiceover**: Write compelling narration that:
   - Matches the tone (${tone || 'Professional'})
   - Complements the visual
   - Is concise but impactful
   - Flows naturally when spoken

3. **duration_seconds**: Each scene should be ${sceneDuration}-${sceneDuration + 2} seconds
   - Total must equal ${durationSeconds} seconds

4. **transition**: Choose between "fade", "cut", or "slide"

SCENE FLOW:
- Scene 1: Hook/Establish (grab attention)
- Scene 2-3: Build/Develop (tell the story)
- Scene 4: Conclude/CTA (strong ending)

OUTPUT FORMAT (strict JSON):
{
  "title": "Engaging Video Title (5-8 words)",
  "total_duration": ${durationSeconds},
  "style": "${style || 'realistic'}",
  "scenes": [
    {
      "scene_number": 1,
      "visual_prompt": "DETAILED 2-3 sentence description with camera angle, lighting, style, and key elements",
      "voiceover": "Compelling narration text",
      "duration_seconds": ${sceneDuration},
      "transition": "fade"
    }
  ]
}

CRITICAL:
- Visual prompts MUST be detailed (minimum 2 sentences)
- Apply ${style || 'realistic'} style to ALL visual prompts
- Total scene durations MUST equal ${durationSeconds} seconds exactly
- Use cinematic language and be specific
- Make it engaging and professional`

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional video director and scriptwriter. You output detailed, structured JSON scripts for video production. Always follow the exact JSON format specified and create highly detailed visual prompts.'
                    },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.8, // Slightly creative but consistent
            }),
        })

        if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error?.message || 'OpenAI API request failed')
        }

        const data = await response.json()
        const script = JSON.parse(data.choices[0].message.content)

        // 3. Validate the script structure
        if (!script.scenes || !Array.isArray(script.scenes) || script.scenes.length === 0) {
            throw new Error('Generated script has invalid structure')
        }

        // Add metadata
        script.generated_at = new Date().toISOString()
        script.user_idea = idea

        // 4. Return the generated script
        return new Response(JSON.stringify(script), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

    } catch (error) {
        console.error('Script generation error:', error)
        return new Response(JSON.stringify({
            error: error.message,
            details: 'Failed to generate video script. Please try again with a different idea or check your API key.'
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
