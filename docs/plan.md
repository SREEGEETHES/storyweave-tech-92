# Implementation Plan: Hybrid Video Editor

This plan tracks the development phases for shifting our SaaS application to a hybrid AI + Manual Video Edition structure.

## Phase 1: Planning and Architecture Approval
- [x] Define hybrid architecture pattern (Claude JSON -> Remotion Editor -> Remotion Lambda)
- [ ] Validate market potential and cost efficiency assumptions
- [ ] Co-founder review and sign-off on the plan

## Phase 2: Core Data Structures
- [ ] Define the canonical `VideoState` JSON schema that will act as the bridge between LLM, Frontend, and Lambda.
- [ ] Scaffold database tables to store `VideoState` and associated assets.

## Phase 3: AI Generation (The Brain)
- [ ] Develop the prompt pipeline for Claude to output valid `VideoState`.
- [ ] Implement the "Style Analyzer" to parse reference videos and output style rules into the JSON.
- [ ] Integrate OpenAI Whisper for one-time captioning.

## Phase 4: Frontend Editor (The Hands)
- [ ] Set up the `@remotion/player` for in-browser video preview.
- [ ] Integrate an open-source React timeline library (e.g., `react-timeline-editor` or `drjaat/react-video-editor`).
- [ ] Bind `VideoState` to the timeline UI.
- [ ] Implement drag-and-drop trimming, text editing, and asset swapping.

## Phase 5: Rendering Pipeline
- [ ] Map the frontend Remotion components to the Remotion Lambda backend.
- [ ] Handle Render triggers, progress states, and video delivery.
