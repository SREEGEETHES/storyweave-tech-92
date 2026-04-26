/**
 * StoryWeave Publisher — Frontend Publishing Service
 *
 * Handles OAuth initiation (popup-based), connected account management,
 * and post scheduling via the backend API.
 *
 * All methods use the Supabase client for account reads and the backend
 * API for write operations that require server-side secrets.
 */

import { supabase } from "@/integrations/supabase/client";
import type { SocialAccount, SocialPlatform, ScheduledPost, PublishJobResult } from "@/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

// ─── OAuth ────────────────────────────────────────────────────────────────────

/**
 * Initiates the OAuth flow for a given platform by opening a popup window.
 * Returns a promise that resolves when the popup signals completion (via
 * postMessage) or rejects on error / timeout.
 */
export async function initiateOAuth(platform: SocialPlatform): Promise<{ username: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Must be logged in to connect a social account");

    // Ask the edge function for the platform-specific authorization URL
    const initRes = await fetch(
        `${SUPABASE_URL}/functions/v1/social-oauth?action=init&platform=${platform}&user_id=${user.id}`,
        {
            headers: {
                apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
        }
    );

    if (!initRes.ok) {
        const err = await initRes.json().catch(() => ({}));
        throw new Error(err.error ?? `Failed to initiate ${platform} OAuth`);
    }

    const { authUrl } = await initRes.json();

    // Open the auth URL in a popup
    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
        authUrl,
        `storyweave_oauth_${platform}`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) throw new Error("Popup was blocked — please allow popups for this site");

    return new Promise((resolve, reject) => {
        const TIMEOUT_MS = 5 * 60 * 1000; // 5 min
        let settled = false;

        const settle = (fn: () => void) => {
            if (settled) return;
            settled = true;
            clearInterval(pollTimer);
            clearTimeout(timeoutTimer);
            window.removeEventListener("message", messageHandler);
            fn();
        };

        // The edge function redirects back to /auto-pilot?oauth=success|error&...
        // We detect this by polling the popup's URL (same-origin after redirect).
        const pollTimer = setInterval(() => {
            try {
                if (popup.closed) {
                    settle(() => reject(new Error("OAuth popup was closed")));
                    return;
                }
                const popupUrl = new URL(popup.location.href);
                if (popupUrl.pathname === "/auto-pilot") {
                    const oauthResult = popupUrl.searchParams.get("oauth");
                    const username = popupUrl.searchParams.get("username") ?? "";
                    const msg = popupUrl.searchParams.get("msg") ?? "Unknown error";
                    popup.close();
                    if (oauthResult === "success") {
                        settle(() => resolve({ username }));
                    } else {
                        settle(() => reject(new Error(msg)));
                    }
                }
            } catch {
                // Cross-origin access blocked while on the platform's domain — normal
            }
        }, 500);

        const timeoutTimer = setTimeout(() => {
            popup.close();
            settle(() => reject(new Error("OAuth timed out — please try again")));
        }, TIMEOUT_MS);

        // Also listen for postMessage as a fallback
        const messageHandler = (event: MessageEvent) => {
            if (event.data?.type !== "storyweave_oauth") return;
            if (event.data.platform !== platform) return;
            popup.close();
            if (event.data.success) {
                settle(() => resolve({ username: event.data.username ?? "" }));
            } else {
                settle(() => reject(new Error(event.data.error ?? "OAuth failed")));
            }
        };
        window.addEventListener("message", messageHandler);
    });
}

// ─── Connected Accounts ───────────────────────────────────────────────────────

/** Fetches the current user's connected social accounts from Supabase. */
export async function getConnectedAccounts(): Promise<SocialAccount[]> {
    const { data, error } = await supabase
        .from("social_accounts")
        .select("id, user_id, platform, platform_user_id, platform_username, platform_avatar_url, token_expires_at, is_active, created_at, updated_at")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return (data ?? []) as SocialAccount[];
}

/** Marks a social account as inactive (soft-delete). */
export async function disconnectAccount(platform: SocialPlatform): Promise<void> {
    const { error } = await supabase
        .from("social_accounts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("platform", platform);

    if (error) throw error;
}

// ─── Publishing ───────────────────────────────────────────────────────────────

export interface PublishNowOptions {
    videoUrl: string;
    caption: string;
    title?: string;
    platforms: SocialPlatform[];
    thumbnailUrl?: string;
    privacyLevel?: "PUBLIC" | "FRIENDS" | "PRIVATE";
}

/**
 * Fires-and-publishes a video to the specified platforms immediately via the
 * backend API (which holds the platform access tokens securely).
 */
export async function publishNow(opts: PublishNowOptions): Promise<PublishJobResult[]> {
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) throw new Error("Not authenticated");

    const res = await fetch(`${API_URL}/social/publish`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(opts),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Publish failed (${res.status})`);
    }

    return res.json();
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

export interface SchedulePostOptions {
    videoUrl: string;
    caption: string;
    title?: string;
    thumbnailUrl?: string;
    platforms: SocialPlatform[];
    /** ISO date string e.g. "2026-04-15" */
    scheduledDate: string;
    /** 24-h time e.g. "14:30" */
    scheduledTime: string;
    privacyLevel?: "PUBLIC" | "FRIENDS" | "PRIVATE";
}

/** Saves a post to the scheduled_posts queue via Supabase. */
export async function schedulePost(opts: SchedulePostOptions): Promise<ScheduledPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
        .from("scheduled_posts")
        .insert({
            user_id: user.id,
            idea: opts.title ?? opts.caption.slice(0, 80),
            caption: opts.caption,
            video_url: opts.videoUrl,
            thumbnail_url: opts.thumbnailUrl ?? null,
            scheduled_date: opts.scheduledDate,
            scheduled_time: opts.scheduledTime,
            platforms: opts.platforms,
            status: "scheduled",
        })
        .select()
        .single();

    if (error) throw error;
    return data as ScheduledPost;
}

/** Returns all scheduled/published posts for the current user. */
export async function getScheduledPosts(status?: ScheduledPost["status"]): Promise<ScheduledPost[]> {
    let query = supabase
        .from("scheduled_posts")
        .select("*")
        .order("scheduled_date", { ascending: true })
        .order("scheduled_time", { ascending: true });

    if (status) {
        query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as ScheduledPost[];
}

/** Cancels a scheduled post (deletes the row). */
export async function cancelScheduledPost(postId: string): Promise<void> {
    const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId)
        .eq("status", "scheduled"); // Safety guard: don't delete already-published posts

    if (error) throw error;
}

/** Retries a failed post by resetting its status and re-attempting publish. */
export async function retryPost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: post, error: fetchError } = await supabase
        .from("scheduled_posts")
        .select("*")
        .eq("id", postId)
        .single();

    if (fetchError) throw fetchError;
    if (!post) throw new Error("Post not found");
    if (post.status !== "failed") throw new Error("Only failed posts can be retried");

    const results = await publishNow({
        videoUrl: post.video_url,
        caption: post.caption,
        title: post.idea,
        platforms: post.platforms,
    });

    const allSuccess = results.every(r => r.success);
    const anySuccess = results.some(r => r.success);
    const publishResult = Object.fromEntries(results.map(r => [r.platform, r.post_id ?? r.error ?? ""]));
    const errorMsg = results.filter(r => !r.success).map(r => `${r.platform}: ${r.error}`).join("; ") || null;

    const { error: updateError } = await supabase
        .from("scheduled_posts")
        .update({
            status: anySuccess ? "published" : "failed",
            published_at: anySuccess ? new Date().toISOString() : null,
            publish_result: publishResult,
            error_message: errorMsg,
            retry_count: (post.retry_count ?? 0) + 1,
        })
        .eq("id", postId);

    if (updateError) throw updateError;
    if (!anySuccess) throw new Error(errorMsg);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Checks whether a platform token is likely still valid (client-side only). */
export function isTokenFresh(account: SocialAccount): boolean {
    if (!account.token_expires_at) return true; // Assume valid if no expiry known
    return new Date(account.token_expires_at) > new Date(Date.now() + 5 * 60 * 1000);
}

export const PLATFORM_META: Record<SocialPlatform, { label: string; color: string; bgColor: string; textColor: string }> = {
    tiktok: {
        label: "TikTok",
        color: "#010101",
        bgColor: "bg-[#010101]/20",
        textColor: "text-white",
    },
    youtube: {
        label: "YouTube Shorts",
        color: "#FF0000",
        bgColor: "bg-red-600/20",
        textColor: "text-red-400",
    },
    instagram: {
        label: "Instagram Reels",
        color: "#E1306C",
        bgColor: "bg-pink-600/20",
        textColor: "text-pink-400",
    },
};
