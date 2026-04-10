import { videoWorker } from './workers/videoWorker.js';
import { scheduleWorker, startScheduleHeartbeat } from './workers/scheduleWorker.js';

console.log('Orchestrator service started...');

// Boot the schedule publisher heartbeat (registers the repeatable job once)
startScheduleHeartbeat().catch((err) => {
    console.error('[Orchestrator] Failed to start schedule heartbeat:', err.message);
});

process.on('SIGTERM', async () => {
    console.log('Shutting down orchestrator...');
    await Promise.all([videoWorker.close(), scheduleWorker.close()]);
    process.exit(0);
});
