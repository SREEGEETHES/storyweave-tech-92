import { supabase } from "@/integrations/supabase/client";

/**
 * StoryWeave DNA Engine — Kimi K2.5 Multimodal Analysis
 * 
 * This service reverse-engineers the "DNA" of a video by analyzing its 
 * frames and structure using Kimi K2.5's vision-to-code capabilities.
 */

export interface VideoDNA {
  avg_shot_length: number;
  cuts: number[];
  transitions: string[];
  color_profile: {
    palette: string[];
    vibe: string;
    contrast: "high" | "medium" | "low";
  };
  typography: {
    font_style: string;
    position: "top" | "center" | "bottom" | "dynamic";
    animation: string;
  };
}

const KIMI_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const KIMI_API_KEY = "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";

/**
 * Extracts the Editing DNA from a video using Kimi K2.5 analysis.
 * @param videoUrl The URL of the video (YouTube or S3)
 * @param frames Base64 encoded keyframes for analysis
 */
export async function extractVideoDNA(videoUrl: string, frames: string[]): Promise<VideoDNA> {
  console.log(`[DNA Engine] Analyzing style for: ${videoUrl}`);

  // Construct the multimodal prompt for Kimi K2.5
  const response = await fetch(KIMI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "nvidia/kimi-k2.5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze the following sequence of frames from a video and extract its "Editing DNA". 
              Return a JSON object with the following fields:
              - avg_shot_length (number): Average duration between cuts.
              - transitions (string[]): Types of transitions used (e.g., "jump cut", "fade", "zoom").
              - color_profile (object): { palette: hex_codes[], vibe: string, contrast: string }.
              - typography (object): { font_style: string, position: string, animation: string }.
              
              Be precise and focus on the technical editing style.`,
            },
            ...frames.map((f) => ({
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${f}` },
            })),
          ],
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Kimi API Error: ${error.message || response.statusText}`);
  }

  const result = await response.json();
  const dna = JSON.parse(result.choices[0].message.content) as VideoDNA;

  return dna;
}

/**
 * Saves a generated DNA clone to the database.
 */
export async function saveDNAClone(name: string, sourceUrl: string, dna: VideoDNA) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Must be logged in to save DNA clones");

  const { data, error } = await supabase
    .from("video_dna")
    .insert({
      user_id: user.id,
      name,
      source_url: sourceUrl,
      dna_json: dna as any,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches all DNA clones for the current user.
 */
export async function getDNAClones() {
  const { data, error } = await supabase
    .from("video_dna")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
