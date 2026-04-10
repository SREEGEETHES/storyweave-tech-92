/**
 * StoryWeave Publisher — Social API Routes
 *
 * Endpoints:
 *   GET    /social/accounts              — list connected accounts (metadata only, no tokens)
 *   DELETE /social/accounts/:platform    — disconnect an account
 *   POST   /social/publish               — publish video to platforms immediately
 *   POST   /social/schedule              — add a post to the schedule queue
 *   GET    /social/schedule              — list scheduled posts
 *   DELETE /social/schedule/:id          — cancel a scheduled post
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { publishVideo } from '../../../orchestrator/src/services/publishService.js';

// ─── Supabase service-role client ─────────────────────────────────────────────

function getSupabase() {
    const url = process.env.SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key);
}

// ─── Validation schemas ───────────────────────────────────────────────────────

const PLATFORMS = ['tiktok', 'youtube', 'instagram'] as const;

const publishSchema = z.object({
    videoUrl: z.string().url(),
    caption: z.string().min(1).max(2200),
    title: z.string().max(100).optional(),
    thumbnailUrl: z.string().url().optional(),
    platforms: z.array(z.enum(PLATFORMS)).min(1),
    privacyLevel: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).default('PUBLIC'),
});

const scheduleSchema = z.object({
    videoUrl: z.string().url(),
    caption: z.string().min(1).max(2200),
    title: z.string().max(100).optional(),
    thumbnailUrl: z.string().url().optional(),
    platforms: z.array(z.enum(PLATFORMS)).min(1),
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    scheduledTime: z.string().regex(/^\d{2}:\d{2}$/),
    privacyLevel: z.enum(['PUBLIC', 'FRIENDS', 'PRIVATE']).default('PUBLIC'),
});

// ─── Route registration ───────────────────────────────────────────────────────

export const socialRoutes = async (fastify: FastifyInstance) => {

    // GET /social/accounts
    fastify.get('/accounts', { preValidation: [fastify.authenticate] }, async (request: any) => {
        const userId = request.user.id;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('social_accounts')
            .select('id, platform, platform_user_id, platform_username, platform_avatar_url, token_expires_at, is_active, created_at, updated_at')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return data;
    });

    // DELETE /social/accounts/:platform
    fastify.delete('/accounts/:platform', { preValidation: [fastify.authenticate] }, async (request: any, reply) => {
        const { platform } = request.params;
        const userId = request.user.id;

        if (!PLATFORMS.includes(platform)) {
            return reply.status(400).send({ error: `Unknown platform: ${platform}` });
        }

        const supabase = getSupabase();
        const { error } = await supabase
            .from('social_accounts')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('platform', platform);

        if (error) throw error;
        return { success: true };
    });

    // POST /social/publish
    fastify.post('/publish', { preValidation: [fastify.authenticate] }, async (request: any, reply) => {
        const parsed = publishSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
        }

        const userId = request.user.id;
        const { videoUrl, caption, title, thumbnailUrl, platforms, privacyLevel } = parsed.data;

        const results = await publishVideo({
            userId,
            videoUrl,
            caption,
            title,
            thumbnailUrl,
            platforms: platforms as string[],
            privacyLevel,
        });

        // Log to scheduled_posts table as "published" records for the activity feed
        const supabase = getSupabase();
        const successfulPlatforms = results.filter(r => r.success).map(r => r.platform);
        if (successfulPlatforms.length > 0) {
            await supabase.from('scheduled_posts').insert({
                user_id: userId,
                idea: title ?? caption.slice(0, 80),
                caption,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl ?? null,
                scheduled_date: new Date().toISOString().split('T')[0],
                scheduled_time: new Date().toTimeString().slice(0, 5),
                status: 'published',
                platforms: successfulPlatforms,
                published_at: new Date().toISOString(),
                publish_result: Object.fromEntries(results.map(r => [r.platform, r.post_id ?? r.error ?? ''])),
            });
        }

        return results;
    });

    // POST /social/schedule
    fastify.post('/schedule', { preValidation: [fastify.authenticate] }, async (request: any, reply) => {
        const parsed = scheduleSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: 'Validation failed', details: parsed.error.issues });
        }

        const userId = request.user.id;
        const { videoUrl, caption, title, thumbnailUrl, platforms, scheduledDate, scheduledTime } = parsed.data;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('scheduled_posts')
            .insert({
                user_id: userId,
                idea: title ?? caption.slice(0, 80),
                caption,
                video_url: videoUrl,
                thumbnail_url: thumbnailUrl ?? null,
                scheduled_date: scheduledDate,
                scheduled_time: scheduledTime,
                platforms,
                status: 'scheduled',
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    });

    // GET /social/schedule
    fastify.get('/schedule', { preValidation: [fastify.authenticate] }, async (request: any) => {
        const userId = request.user.id;
        const supabase = getSupabase();

        const { data, error } = await supabase
            .from('scheduled_posts')
            .select('*')
            .eq('user_id', userId)
            .order('scheduled_date', { ascending: true })
            .order('scheduled_time', { ascending: true });

        if (error) throw error;
        return data;
    });

    // DELETE /social/schedule/:id
    fastify.delete('/schedule/:id', { preValidation: [fastify.authenticate] }, async (request: any, reply) => {
        const { id } = request.params;
        const userId = request.user.id;
        const supabase = getSupabase();

        const { error } = await supabase
            .from('scheduled_posts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .eq('status', 'scheduled');

        if (error) throw error;
        return { success: true };
    });
};
