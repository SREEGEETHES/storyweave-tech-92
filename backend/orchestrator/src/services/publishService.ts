/**
 * StoryWeave Publisher — Platform Publishing Service
 *
 * Implements the core social media publishing logic (adapted from Postiz
 * open-source patterns) natively into the StoryWeave backend.
 *
 * Supports:
 *   - TikTok: pull-from-URL via Content Posting API v2
 *   - YouTube Shorts: download + resumable upload via YouTube Data API v3
 *   - Instagram Reels: pull-from-URL via Instagram Graph API (Reels container flow)
 */

import axios from 'axios';
import https from 'https';
import { createWriteStream, createReadStream } from 'fs';
import { unlink, stat } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// ─── Supabase client (service role — for token lookups) ───────────────────────

function getSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    return createClient(url, key);
}

// ─── Token retrieval ──────────────────────────────────────────────────────────

async function getAccessToken(userId: string, platform: string): Promise<string> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('social_accounts')
        .select('access_token, token_expires_at')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('is_active', true)
        .single();

    if (error || !data) throw new Error(`No connected ${platform} account for user ${userId}`);

    if (data.token_expires_at && new Date(data.token_expires_at) < new Date()) {
        throw new Error(`${platform} token expired — user must re-authenticate`);
    }

    return data.access_token;
}

// ─── TikTok ───────────────────────────────────────────────────────────────────

interface TikTokPublishOptions {
    videoUrl: string;
    caption: string;
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'SELF_ONLY';
    disableDuet?: boolean;
    disableComment?: boolean;
    disableStitch?: boolean;
}

async function publishToTikTok(accessToken: string, opts: TikTokPublishOptions): Promise<{ post_id: string; url: string }> {
    const body = {
        post_info: {
            title: opts.caption.slice(0, 150),
            privacy_level: opts.privacyLevel ?? 'PUBLIC_TO_EVERYONE',
            disable_duet: opts.disableDuet ?? false,
            disable_comment: opts.disableComment ?? false,
            disable_stitch: opts.disableStitch ?? false,
            video_cover_timestamp_ms: 1000,
        },
        source_info: {
            source: 'PULL_FROM_URL',
            video_url: opts.videoUrl,
        },
        post_mode: 'DIRECT_POST',
        media_type: 'VIDEO',
    };

    const res = await axios.post(
        'https://open.tiktokapis.com/v2/post/publish/video/init/',
        body,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
        }
    );

    const { data, error } = res.data;
    if (error?.code && error.code !== 'ok') {
        throw new Error(`TikTok API error: ${error.message} (${error.code})`);
    }

    const publishId = data?.publish_id ?? `tiktok_${Date.now()}`;
    return {
        post_id: publishId,
        url: `https://www.tiktok.com/@me/video/${publishId}`,
    };
}

// ─── YouTube ──────────────────────────────────────────────────────────────────

interface YouTubePublishOptions {
    videoUrl: string;
    title: string;
    description?: string;
    privacyStatus?: 'public' | 'unlisted' | 'private';
    categoryId?: string;
    tags?: string[];
    /** If true we attempt a "Made for Kids" flag */
    madeForKids?: boolean;
}

/** Downloads a file from a URL to a local temp path. */
async function downloadToTemp(url: string, ext = 'mp4'): Promise<string> {
    const tmpPath = join(tmpdir(), `sw_yt_${Date.now()}.${ext}`);
    return new Promise((resolve, reject) => {
        const file = createWriteStream(tmpPath);
        https.get(url, (res) => {
            res.pipe(file);
            file.on('finish', () => { file.close(); resolve(tmpPath); });
        }).on('error', (err) => { unlink(tmpPath).catch(() => {}); reject(err); });
    });
}

async function publishToYouTube(accessToken: string, opts: YouTubePublishOptions): Promise<{ post_id: string; url: string }> {
    // YouTube doesn't support pull-from-URL — we need to download then upload.
    let tmpPath: string | null = null;

    try {
        console.log(`[YouTube] Downloading video from S3…`);
        tmpPath = await downloadToTemp(opts.videoUrl);
        const fileStat = await stat(tmpPath);

        // Step 1: Initiate resumable upload session
        const metaRes = await axios.post(
            'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
            {
                snippet: {
                    title: opts.title.slice(0, 100),
                    description: (opts.description ?? '').slice(0, 5000),
                    categoryId: opts.categoryId ?? '22', // People & Blogs
                    tags: opts.tags ?? [],
                    defaultLanguage: 'en',
                },
                status: {
                    privacyStatus: opts.privacyStatus ?? 'public',
                    selfDeclaredMadeForKids: opts.madeForKids ?? false,
                    embeddable: true,
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'X-Upload-Content-Type': 'video/mp4',
                    'X-Upload-Content-Length': String(fileStat.size),
                },
            }
        );

        const uploadUri = metaRes.headers['location'];
        if (!uploadUri) throw new Error('YouTube did not return an upload URI');

        // Step 2: Stream the video to the resumable upload URI
        console.log(`[YouTube] Uploading ${Math.round(fileStat.size / 1024 / 1024)} MB…`);
        const uploadRes = await axios.put(uploadUri, createReadStream(tmpPath), {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Length': String(fileStat.size),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
        });

        const videoId = uploadRes.data?.id;
        if (!videoId) throw new Error('YouTube upload did not return a video ID');

        return {
            post_id: videoId,
            url: `https://www.youtube.com/shorts/${videoId}`,
        };
    } finally {
        if (tmpPath) await unlink(tmpPath).catch(() => {});
    }
}

// ─── Instagram Reels ──────────────────────────────────────────────────────────

interface InstagramPublishOptions {
    videoUrl: string;
    caption: string;
    shareToFeed?: boolean;
    /** User's Instagram Business/Creator account ID */
    igUserId?: string;
}

async function publishToInstagram(accessToken: string, opts: InstagramPublishOptions): Promise<{ post_id: string; url: string }> {
    // Resolve the user's IG account ID if not provided
    let igUserId = opts.igUserId;
    if (!igUserId) {
        const meRes = await axios.get('https://graph.instagram.com/me', {
            params: { fields: 'id', access_token: accessToken },
        });
        igUserId = meRes.data.id;
    }

    // Step 1: Create the Reels media container
    const containerRes = await axios.post(
        `https://graph.instagram.com/${igUserId}/media`,
        null,
        {
            params: {
                media_type: 'REELS',
                video_url: opts.videoUrl,
                caption: opts.caption.slice(0, 2200),
                share_to_feed: opts.shareToFeed ?? true,
                access_token: accessToken,
            },
        }
    );

    const containerId = containerRes.data?.id;
    if (!containerId) throw new Error('Instagram did not return a container ID');

    // Step 2: Poll until the container is ready (Instagram processes the video)
    console.log(`[Instagram] Waiting for container ${containerId} to be ready…`);
    let ready = false;
    for (let attempt = 0; attempt < 20; attempt++) {
        await new Promise((r) => setTimeout(r, 5000));
        const statusRes = await axios.get(`https://graph.instagram.com/${containerId}`, {
            params: { fields: 'status_code', access_token: accessToken },
        });
        const statusCode = statusRes.data?.status_code;
        if (statusCode === 'FINISHED') { ready = true; break; }
        if (statusCode === 'ERROR') throw new Error('Instagram video processing failed');
        console.log(`[Instagram] Container status: ${statusCode} (attempt ${attempt + 1})`);
    }

    if (!ready) throw new Error('Instagram video processing timed out after 100 seconds');

    // Step 3: Publish the container
    const publishRes = await axios.post(
        `https://graph.instagram.com/${igUserId}/media_publish`,
        null,
        { params: { creation_id: containerId, access_token: accessToken } }
    );

    const mediaId = publishRes.data?.id;
    if (!mediaId) throw new Error('Instagram did not return a media ID after publishing');

    return {
        post_id: mediaId,
        url: `https://www.instagram.com/p/${mediaId}/`,
    };
}

// ─── Public multi-platform orchestrator ──────────────────────────────────────

export interface PublishOptions {
    userId: string;
    videoUrl: string;
    caption: string;
    title?: string;
    thumbnailUrl?: string;
    platforms: string[];
    privacyLevel?: 'PUBLIC' | 'FRIENDS' | 'PRIVATE';
}

export interface PlatformResult {
    platform: string;
    success: boolean;
    post_id?: string;
    url?: string;
    error?: string;
}

export async function publishVideo(opts: PublishOptions): Promise<PlatformResult[]> {
    const results: PlatformResult[] = [];

    for (const platform of opts.platforms) {
        try {
            let accessToken: string;
            try {
                accessToken = await getAccessToken(opts.userId, platform);
            } catch (e: any) {
                results.push({ platform, success: false, error: e.message });
                continue;
            }

            if (platform === 'tiktok') {
                const privacyLevel = opts.privacyLevel === 'FRIENDS'
                    ? 'MUTUAL_FOLLOW_FRIENDS'
                    : opts.privacyLevel === 'PRIVATE'
                    ? 'SELF_ONLY'
                    : 'PUBLIC_TO_EVERYONE';

                const r = await publishToTikTok(accessToken, {
                    videoUrl: opts.videoUrl,
                    caption: opts.caption,
                    privacyLevel,
                });
                results.push({ platform, success: true, ...r });

            } else if (platform === 'youtube') {
                const r = await publishToYouTube(accessToken, {
                    videoUrl: opts.videoUrl,
                    title: opts.title ?? opts.caption.slice(0, 100),
                    description: opts.caption,
                    privacyStatus: opts.privacyLevel === 'PRIVATE' ? 'private'
                        : opts.privacyLevel === 'FRIENDS' ? 'unlisted'
                        : 'public',
                });
                results.push({ platform, success: true, ...r });

            } else if (platform === 'instagram') {
                const r = await publishToInstagram(accessToken, {
                    videoUrl: opts.videoUrl,
                    caption: opts.caption,
                });
                results.push({ platform, success: true, ...r });

            } else {
                results.push({ platform, success: false, error: `Unsupported platform: ${platform}` });
            }

        } catch (err: any) {
            console.error(`[publishVideo] ${platform} failed:`, err.message);
            results.push({ platform, success: false, error: err.message });
        }
    }

    return results;
}
