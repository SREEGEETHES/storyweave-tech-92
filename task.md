# StoryWeave Build Roadmap: 48-Hour Sprint

**Goal**: Build the "Plug & Play" Video SaaS Engine.
**Target Status**: Ready for Kimi/MiniMax keys by EOD tomorrow.

## 🛠️ Sprint 1: Setup & Data State
- [ ] Install Claude MCP Plugins (`frontend-design`, `superpowers`) to enforce UI/UX consistency.
- [x] Define the `VideoState` JSON schema (The core engine DNA).
- [ ] Set up **Neon (Serverless Postgres)** and link the `Projects`/`VideoDNA` tables.
- [ ] Build the `VideoStateContext` to share data across the app.

## 🧠 Sprint 2: AI Factory 
- [x] Write the Python/Node scripts for **Qwen3-TTS** and **ACE-Step 1.5** integration.
- [x] Connect the **Whisper** local endpoint for captioning.
- [x] Connect the **Seedream 5.0 Lite** (Image) API structure.

## 🎨 Sprint 3: The Hybrid Visual Editor (Frontend)
*Goal: Build a manual editor heavily inspired by DesignCombo and Remotion Editor Starter, allowing both AI-prompted changes and deep manual adjustments.*
- [x] Scaffold the **Advanced Timeline Editor** (Multi-track, Drag & drop clips, Real-time Remotion preview).
- [x] Implement the **"Gap" Editor Features**: Audio waveforms on tracks, filmstrip thumbnails, rolling edits/split tool.
- [x] Build the **Inspector Panels**: Volume/fade controls, crop/border-radius, align/position composition inspector.
- [x] Add advanced timeline interactions: Undo/redo history stack, snapping & marquee select.
- [x] Integrate **Klipy GIF API** (`KLIPY-com/Klipy-GIF-API`) as native GIF item types and implement advanced caption item types.

## 🚀 Sprint 4: Rendering & Backend Pipeline (Remotion Lambda)
*Goal: Build the robust cloud rendering infrastructure modeled after the DesignCombo + Remotion Lambda architecture.*
- [x] Set up the **`/api/render` route** to validate requests and map the JSON design to inputProps.
- [x] Implement a **Postgres/Redis Job Queue** to save render jobs (`{renderId, userId, status}`) in Neon.
- [x] Connect the `renderMediaOnLambda()` function to spin up AWS Lambda parallel headless browser chunks.
- [x] Build the `/api/progress` polling endpoints and Webhook status callbacks.
- [x] Configure the **S3 Bucket integration** for saving input assets and the final MP4 output (with Pre-signed upload URLs).
- [x] Finalize the Frontend Progress UI (% bar to download link).

## 🌍 Sprint 5: Infrastructure & Deployment (Future-Proofing)
- [x] Write the **Docker** setup (`Dockerfile` & `docker-compose.yml`) for the backend/frontend.
- [x] Create the **Terraform** scripts to provision cloud infrastructure (VPC, Instances, Storage).
- [x] Write the **Kubernetes** manifests for scalable deployment of the AI processing nodes.
- [x] Setup standard **CI/CD pipeline** (GitHub Actions) for automatic testing and deployment.

## 📱 Sprint 6: Social Media Auto-Publishing
- [x] Integrate **Postiz** core publishing logic (Oauth for TikTok, Shorts, Instagram).
- [x] Build the "StoryWeave Publisher" UI (White-labeled, scheduled posting calendar).
- [x] Wire the Remotion Lambda S3 output directly into the publishing queue.

---
*Agent Instruction: Pick the top task, build it fully, then check it off.*
