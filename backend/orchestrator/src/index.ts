import { videoWorker } from './workers/videoWorker.js';

console.log('Orchestrator service started...');

process.on('SIGTERM', async () => {
    console.log('Shutting down orchestrator...');
    await videoWorker.close();
    process.exit(0);
});
