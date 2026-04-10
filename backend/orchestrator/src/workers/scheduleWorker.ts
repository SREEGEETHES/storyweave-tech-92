/**
 * StoryWeave Publisher — Schedule Worker
 *
 * A BullMQ repeatable job that fires every 60 seconds. It queries the
 * scheduled_posts table for posts whose scheduled time has passed
 * (status = 'scheduled') and publishes them to the configured platforms.
 *
 * Integrated into orchestrator/src/index.ts alongside videoWorker.
 */

import { Worker, Queue, Job } from 'bullmq';
import { createClient } from '@supabase/supabase-js';
import { publishVideo } from '../services/publishService.js';
import dotenv from 'dotenv';

dotenv.config();

const connection = {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
};

const SCHEDULE_QUEUE = 'schedule-publisher';
const MAX_RETRIES = 3;

// ─── Supabase service client ──────────────────────────────────────────────────

function getSupabase() {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key);
}

// ─── Queue setup ──────────────────────────────────────────────────────────────

const scheduleQueue = new Queue(SCHEDULE_QUEUE, { connection });

/** Register the repeatable heartbeat job. Safe to call multiple times. */
export async function startScheduleHeartbeat(): Promise<void> {
    await scheduleQueue.add(
        'heartbeat',
        {},
        {
            repeat: { every: 60_000 }, // every 60 seconds
            jobId: 'schedule-heartbeat',
            removeOnComplete: { count: 10 },
            removeOnFail: { count: 50 },
        }
    );
    console.log('[ScheduleWorker] Heartbeat registered (every 60 s)');
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const scheduleWorker = new Worker(
    SCHEDULE_QUEUE,
    async (_job: Job) => {
        const supabase = getSupabase();
        const now = new Date();
        const todayDate = now.toISOString().split('T')[0];         // "2026-04-10"
        const currentTime = now.toTimeString().slice(0, 5);        // "14:30"

        console.log(`[ScheduleWorker] Checking due posts at ${todayDate} ${currentTime}…`);

        // Fetch all posts that are scheduled and whose date+time has passed
        const { data: duePosts, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('status', 'scheduled')
            .lte('retry_count', MAX_RETRIES)
            .or(
                `scheduled_date.lt.${todayDate},` +
                `and(scheduled_date.eq.${todayDate},scheduled_time.lte.${currentTime})`
            );

        if (error) {
            console.error('[ScheduleWorker] DB query failed:', error.message);
            return;
        }

        if (!duePosts || duePosts.length === 0) {
            console.log('[ScheduleWorker] No posts due.');
            return;
        }

        console.log(`[ScheduleWorker] ${duePosts.length} post(s) due for publishing`);

        for (const post of duePosts) {
            console.log(`[ScheduleWorker] Publishing post ${post.id} → ${post.platforms.join(', ')}`);

            try {
                const results = await publishVideo({
                    userId: post.user_id,
                    videoUrl: post.video_url,
                    caption: post.caption,
                    title: post.idea,
                    platforms: post.platforms,
                });

                const allSuccess = results.every(r => r.success);
                const anySuccess = results.some(r => r.success);
                const publishResult = Object.fromEntries(
                    results.map(r => [r.platform, r.post_id ?? r.error ?? ''])
                );
                const errorMsg = results
                    .filter(r => !r.success)
                    .map(r => `${r.platform}: ${r.error}`)
                    .join('; ') || null;

                await supabase
                    .from('scheduled_posts')
                    .update({
                        status: allSuccess ? 'published' : anySuccess ? 'published' : 'failed',
                        published_at: anySuccess ? now.toISOString() : null,
                        publish_result: publishResult,
                        error_message: errorMsg,
                        retry_count: post.retry_count + (allSuccess ? 0 : 1),
                    })
                    .eq('id', post.id);

                if (allSuccess) {
                    console.log(`[ScheduleWorker] Post ${post.id} published successfully`);
                } else if (anySuccess) {
                    console.warn(`[ScheduleWorker] Post ${post.id} partially published. Errors: ${errorMsg}`);
                } else {
                    console.error(`[ScheduleWorker] Post ${post.id} failed: ${errorMsg}`);
                }

            } catch (err: any) {
                console.error(`[ScheduleWorker] Unexpected error for post ${post.id}:`, err.message);

                const newRetryCount = (post.retry_count ?? 0) + 1;
                await supabase
                    .from('scheduled_posts')
                    .update({
                        status: newRetryCount >= MAX_RETRIES ? 'failed' : 'scheduled',
                        error_message: err.message,
                        retry_count: newRetryCount,
                    })
                    .eq('id', post.id);
            }
        }
    },
    { connection, concurrency: 1 }
);

scheduleWorker.on('completed', () => {
    // Heartbeat tick logged inside the job handler
});

scheduleWorker.on('failed', (_job, err) => {
    console.error('[ScheduleWorker] Worker job failed:', err.message);
});
