import { Worker, Job } from 'bullmq';
import dotenv from 'dotenv';
import { generateScript } from '../services/scriptService.js';
import {
    imageQueue,
    voiceQueue,
    addImageJob,
    addVoiceJob,
    addBGMJob,
    addCaptionJob,
} from '../queues/assetQueues.js';
import { renderVideo } from '../services/renderService.js';
import { publishVideo } from '../services/publishService.js';

dotenv.config();

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

/**
 * Video Generation Pipeline
 * --------------------------
 * State machine driven by job.data.status:
 *
 *  CREATED
 *    → generate script (Ollama)                              → SCRIPTED
 *  SCRIPTED
 *    → dispatch per-scene image + voice jobs                 → ASSET_GENERATION_IN_PROGRESS
 *    → dispatch one BGM job for the whole video
 *  ASSET_GENERATION_IN_PROGRESS
 *    → poll until all scene assets complete                  → ASSETS_READY
 *  ASSETS_READY
 *    → dispatch Whisper captioning job on merged voiceover   → CAPTIONING_IN_PROGRESS
 *  CAPTIONING_IN_PROGRESS
 *    → wait for caption job                                  → CAPTIONS_READY
 *  CAPTIONS_READY
 *    → call Remotion render with full manifest               → RENDERED
 *  RENDERED
 *    → (optional publish step)                               → DONE
 */

export const videoWorker = new Worker(
    'video-generation',
    async (job: Job) => {
        console.log(`[VideoWorker] Job ${job.id} | status: ${job.data.status}`);
        const { status, idea, duration, script, assetJobs, assetResults, captionJobId, videoPath } = job.data;

        switch (status) {

            // ------------------------------------------------------------------
            case 'CREATED': {
                console.log('[VideoWorker] Generating script…');
                const newScript = await generateScript(idea, duration);
                console.log(`[VideoWorker] Script: "${newScript.title}" (${newScript.scenes.length} scenes)`);
                await job.updateData({ ...job.data, script: newScript, status: 'SCRIPTED' });
                break;
            }

            // ------------------------------------------------------------------
            case 'SCRIPTED': {
                console.log('[VideoWorker] Dispatching per-scene asset jobs…');
                const trackedJobs: Array<{ imgJobId: string | undefined; voiceJobId: string | undefined }> = [];

                for (let i = 0; i < script.scenes.length; i++) {
                    const scene = script.scenes[i];

                    const imgJob = await addImageJob(`img_s${i}_${job.id}`, {
                        prompt: scene.visualPrompt,
                        jobId: job.id!,
                        sceneIndex: i,
                    });

                    const voiceJob = await addVoiceJob(`voice_s${i}_${job.id}`, {
                        text: scene.voiceoverText,
                        jobId: job.id!,
                        sceneIndex: i,
                    });

                    trackedJobs.push({ imgJobId: imgJob.id, voiceJobId: voiceJob.id });
                }

                // Dispatch one BGM job for the whole video
                const totalDurationSeconds = script.scenes.reduce((sum: number, s: any) => sum + (s.duration || 5), 0);
                const bgmJob = await addBGMJob(`bgm_${job.id}`, {
                    prompt: `${script.title} — cinematic background music`,
                    jobId: job.id!,
                    duration: totalDurationSeconds,
                    genre: 'cinematic',
                    mood: 'neutral',
                });

                await job.updateData({
                    ...job.data,
                    assetJobs: trackedJobs,
                    bgmJobId: bgmJob.id,
                    status: 'ASSET_GENERATION_IN_PROGRESS',
                });
                break;
            }

            // ------------------------------------------------------------------
            case 'ASSET_GENERATION_IN_PROGRESS': {
                console.log('[VideoWorker] Checking asset completion…');

                // Collect completed image + voice results from their queues
                const images: string[] = [];
                const audios: string[] = [];
                let allDone = true;

                for (let i = 0; i < assetJobs.length; i++) {
                    const { imgJobId, voiceJobId } = assetJobs[i];

                    const imgJob  = imgJobId  ? await imageQueue.getJob(imgJobId)  : null;
                    const voiceJob = voiceJobId ? await voiceQueue.getJob(voiceJobId) : null;

                    const imgState   = await imgJob?.getState();
                    const voiceState = await voiceJob?.getState();

                    if (imgState !== 'completed' || voiceState !== 'completed') {
                        allDone = false;
                        console.log(`[VideoWorker] Scene ${i}: img=${imgState}, voice=${voiceState}`);
                        break;
                    }

                    const imgResult   = await imgJob!.returnvalue;
                    const voiceResult = await voiceJob!.returnvalue;
                    images.push(imgResult.imageUrl);
                    audios.push(voiceResult.audioUrl);
                }

                if (!allDone) {
                    // Re-queue this job to check again shortly; do not advance state
                    break;
                }

                await job.updateData({
                    ...job.data,
                    assetResults: { images, audios },
                    status: 'ASSETS_READY',
                });
                break;
            }

            // ------------------------------------------------------------------
            case 'ASSETS_READY': {
                console.log('[VideoWorker] Assets ready — dispatching Whisper captioning…');

                // Use the first scene's audio URL for captioning (full voiceover)
                // In a complete pipeline this would be the merged voiceover track.
                const masterVoiceoverUrl = assetResults?.audios?.[0];

                if (!masterVoiceoverUrl) {
                    throw new Error('No voiceover URL found in assetResults to caption');
                }

                const captionJob = await addCaptionJob(`caption_${job.id}`, {
                    audioUrl: masterVoiceoverUrl,
                    jobId: job.id!,
                    language: 'en',
                    fps: 30,
                });

                await job.updateData({
                    ...job.data,
                    captionJobId: captionJob.id,
                    status: 'CAPTIONING_IN_PROGRESS',
                });
                break;
            }

            // ------------------------------------------------------------------
            case 'CAPTIONING_IN_PROGRESS': {
                console.log('[VideoWorker] Waiting for captions…');
                // Caption job check handled by captionQueue (bullmq); advance state when done
                // The caption worker will update job data via a separate event handler
                // For simplicity, re-queue and check:
                const { Queue } = await import('bullmq');
                const cQueue = new Queue('captioning', { connection });
                const captionJob = captionJobId ? await cQueue.getJob(captionJobId) : null;
                const captionState = await captionJob?.getState();

                if (captionState !== 'completed') {
                    console.log(`[VideoWorker] Caption job state: ${captionState}`);
                    break;
                }

                const captionResult = await captionJob!.returnvalue;
                await job.updateData({
                    ...job.data,
                    captions: captionResult.segments,
                    status: 'CAPTIONS_READY',
                });
                break;
            }

            // ------------------------------------------------------------------
            case 'CAPTIONS_READY': {
                console.log('[VideoWorker] Starting Remotion render…');

                // Build the full render manifest (maps to VideoState schema)
                const manifest = {
                    id: job.id,
                    global: {
                        fps: 30,
                        durationInFrames: script.scenes.reduce(
                            (sum: number, s: any) => sum + Math.round((s.duration || 5) * 30),
                            0
                        ),
                        width: 1920,
                        height: 1080,
                    },
                    audio: {
                        voiceoverUrl: assetResults?.audios?.[0],
                        bgmUrl: job.data.bgmResult?.audioUrl,
                        volumeBgm: 0.3,
                    },
                    captions: job.data.captions ?? [],
                    scenes: script.scenes.map((s: any, i: number) => ({
                        id: `scene_${i}`,
                        startFrame: script.scenes
                            .slice(0, i)
                            .reduce((sum: number, prev: any) => sum + Math.round((prev.duration || 5) * 30), 0),
                        durationInFrames: Math.round((s.duration || 5) * 30),
                        transitionType: 'fade' as const,
                        visualType: 'image' as const,
                        visualUrl: assetResults?.images?.[i] ?? '',
                        kenBurnsEffect: true,
                    })),
                };

                const renderedVideoPath = await renderVideo(job.id ?? 'job', manifest);
                console.log(`[VideoWorker] Render complete: ${renderedVideoPath}`);
                await job.updateData({ ...job.data, videoPath: renderedVideoPath, status: 'RENDERED' });
                break;
            }

            // ------------------------------------------------------------------
            case 'RENDERED': {
                console.log(`[VideoWorker] Job ${job.id} complete. Video at: ${job.data.videoPath}`);
                break;
            }

            default:
                console.warn(`[VideoWorker] Unknown status: ${status}`);
        }
    },
    { connection }
);

videoWorker.on('completed', (job) => {
    console.log(`[VideoWorker] Job ${job.id} finished`);
});

videoWorker.on('failed', (job, err) => {
    console.error(`[VideoWorker] Job ${job?.id} failed: ${err.message}`);
});
