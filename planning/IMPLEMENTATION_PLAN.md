# StoryWeave Implementation Plan: Hybrid AI Video SaaS

## Architecture Overview
The goal is to build a "Plug-and-Play" Video SaaS using a Hybrid AI + Remotion architecture. 

The system relies on a React + Vite + Tailwind frontend that connects to **Neon (Serverless Postgres)** for the database and **AWS S3** for storage. The core logic handles a structured `VideoState` object which is injected into a `@remotion/player` for rendering.

### The Dual-Path Generation & Hybrid Editor:
1. **Direct Mode**: The user inputs a topic and selects a voice. The AI generates the script, image prompts, and timings from scratch.
2. **DNA (Style-Match) Mode (Vibe Coding)**: The user uploads a reference video (up to 100MB). Utilizing **Kimi K2.5**'s native multimodal vision-to-code capabilities, the backend extracts a Video DNA JSON representing the pacing, cuts, and transitions. The user provides a new topic, and Kimi generates assets matching the exact vibe.
3. **The Manual Editor**: A full manual video editor must be available (inspired by `designcombo/react-video-editor` and `remotion editor starter`). The editor must support multi-track timelines, drag & drop, S3 pre-signed upload assets, rolling edits, undo/redo history, and a composition inspector.

## Backend Rendering Architecture
The application follows a production-grade Remotion Lambda pipeline:
1. **Trigger**: POST to `/api/render` with the design JSON.
2. **Queue**: Save the job to Postgres/Redis.
3. **Lambda**: Call `renderMediaOnLambda()` to trigger AWS Lambda for parallel frame rendering.
4. **Storage**: Lambda saves the final MP4 to an S3 bucket.
5. **Status**: Frontend polls `/api/progress` while a Webhook updates the Database row upon completion.

## Social Media Auto-Publishing (White-Labeled)
After rendering the MP4, users should be able to automatically distribute videos to TikTok, YouTube Shorts, and Instagram Reels. 
We integrate the open-source logic from **Postiz** natively into our dashboard. The integration must be completely white-labeled, with the UI matching the StoryWeave dark theme.

## Media Vault & Smart Ingestion (The "Obsidian" Layer)
This involves an AI-powered media vault setup with full-text search and semantic search for user assets, powered by `ffmpeg` frame extraction and auto-tagging.

## Agentic Editor Powers (The "Hyper Edit" Layer)
Advanced features like:
- **Command Bar (Ctrl+K)**: Text-to-action commands.
- **Automated B-Roll Sourcing**: Suggests matching Vault clips.
- **Audio Extraction**: One-click "Detach Audio".
- **Variation Engine**: Generate 3 AI script/visual variants to remix.
