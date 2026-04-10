import { Worker, Job, FlowProducer } from 'bullmq';
import dotenv from 'dotenv';
import { generateScript } from '../services/scriptService.js';
import { imageQueue, voiceQueue } from '../queues/assetQueues.js';
import { renderVideo } from '../services/renderService.js';
import { publishVideo } from '../services/publishService.js';

dotenv.config();

const connection = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
};

export const videoWorker = new Worker(
    'video-generation',
    async (job: Job) => {
        console.log(`Processing job ${job.id} with data:`, job.data);

        const { status, idea, duration, script, assetResults, videoPath } = job.data;

        switch (status) {
            case 'CREATED':
                console.log('Generating script...');
                const newScript = await generateScript(idea, duration);
                console.log('Script generated:', newScript.title);
                await job.updateData({ ...job.data, script: newScript, status: 'SCRIPTED' });
                // NOTE: In a real system, we'd immediately move to dispatching assets or let the next iteration do it.
                break;
            case 'SCRIPTED':
                console.log('Dispatching asset jobs for scenes...');
                const assetJobs = [];

                for (let i = 0; i < script.scenes.length; i++) {
                    const scene = script.scenes[i];
                    const imgJob = await imageQueue.add(`img_s${i}_${job.id}`, { prompt: scene.visualPrompt, jobId: job.id, sceneIndex: i });
                    const voiceJob = await voiceQueue.add(`voice_s${i}_${job.id}`, { text: scene.voiceoverText, jobId: job.id, sceneIndex: i });
                    assetJobs.push({ imgJobId: imgJob.id, voiceJobId: voiceJob.id });
                }

                await job.updateData({ ...job.data, assetJobs, status: 'ASSET_GENERATION_IN_PROGRESS' });
                break;
            case 'ASSET_GENERATION_IN_PROGRESS':
                // TODO: Implement a way to check if all sub-jobs are done.
                // For now, we'll simulate completion.
                console.log('Checking asset completion...');
                await job.updateData({ ...job.data, status: 'ASSETS_READY' });
                break;
            case 'ASSETS_READY':
                console.log('Starting render...');
                const manifest = {
                    scenes: script.scenes.map((s: any, i: number) => ({
                        ...s,
                        imageUrl: assetResults?.images[i],
                        audioUrl: assetResults?.audio[i],
                    })),
                };
                const videoPath = await renderVideo(job.id || 'job', manifest);
                console.log('Render complete:', videoPath);
                await job.updateData({ ...job.data, videoPath, status: 'RENDERED' });
                break;
            case 'RENDERED':
                console.log('Job finished!');
                break;
            default:
                console.log('Unknown status or job complete');
        }
    },
    { connection }
);

videoWorker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully`);
});

videoWorker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed with error: ${err.message}`);
});
