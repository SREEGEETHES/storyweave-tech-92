# Hybrid Video Editor

## Objective
Design and implement a hybrid video generation system that combines the AI generation capabilities of Claude with the visual editing power of Remotion Editor Starter. This approach minimizes rendering costs, avoids expensive API calls for adjustments, and gives users full control over the final output.

## Architecture Pattern: "JSON-State" Orchestration

### 1. AI Generation (The Initial Draft)
- **Input**: User prompt, assets (photos, videos, audio), and analyzed video editing style.
- **Processing**: Claude orchestrates the scene composition and returns a structured JSON schema representing the video.
  - Example output: `{"scenes": [{"type": "video", "duration": 5, "start": 0, "text": "Hello", "assets": [...]}]}`
- **Storage**: The state is stored in the database and loaded onto the frontend.

### 2. The Manual Bridge (No-Cost Editing)
- **Frontend Editor**: A custom React-based video editor built using free, open-source timeline libraries (e.g., `react-timeline-editor`, `designcombo/react-video-editor`, or `Twick`) combined with the `@remotion/player` package.
- **Trimming & Swapping**: Users can visually adjust clip durations, swap B-rolls, and move assets on a timeline. Since this is purely client-side React state manipulation, it costs $0 in LLM or Render API fees.
- **Captions**: OpenAI Whisper (or similar) generates captions once, and users manually fix typos via the UI.
- **Style Control**: The analyzed style constraints are applied to the visual canvas, ensuring brand consistency.

### 3. The Final Render (Cloud)
- **Export Trigger**: When the user is satisfied with their edits, they click "Export."
- **Processing**: The final modified JSON state is dispatched to the backend (Remotion Lambda).
- **Rendering**: The video is rendered in the cloud and securely delivered to the user.

## Business and Market Advantages
- **Cost Efficiency**: Costs are restricted to the initial LLM prompt and the final backend render. Iterative editing by the user is practically free.
- **User Retention & Control**: Users prefer "CapCut-style" control over rigid "Pure AI" workflows. This reduces frustration when AI makes minor mistakes.
- **Competitive "Style Moat"**: The ability to extract and apply a video editing style from reference videos serves as a premium "Pro" feature, differentiating from standard Text-to-Video models.
