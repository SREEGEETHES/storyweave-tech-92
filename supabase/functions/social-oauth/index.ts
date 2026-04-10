/**
 * StoryWeave Publisher — Social OAuth Edge Function
 *
 * Handles the server-side OAuth token exchange for TikTok, YouTube (Google),
 * and Instagram (Meta). The client_secrets never leave the server.
 *
 * Flow:
 *   1. Frontend opens popup → /social-oauth?action=init&platform=tiktok&user_id=...
 *      → Returns a redirect to the platform's authorization URL.
 *   2. Platform redirects back → /social-oauth?platform=tiktok&code=...&state=<b64_state>
 *      → Exchanges the code, saves tokens to social_accounts, redirects to app.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Platform configurations ──────────────────────────────────────────────────

interface PlatformConfig {
    authUrl: string;
    tokenUrl: string;
    scopes: string;
    clientIdEnv: string;
    clientSecretEnv: string;
    redirectUriEnv: string;
}

const PLATFORMS: Record<string, PlatformConfig> = {
    tiktok: {
        authUrl: "https://www.tiktok.com/v2/auth/authorize",
        tokenUrl: "https://open.tiktokapis.com/v2/oauth/token/",
        scopes: "user.info.basic,video.publish,video.upload",
        clientIdEnv: "TIKTOK_CLIENT_KEY",
        clientSecretEnv: "TIKTOK_CLIENT_SECRET",
        redirectUriEnv: "TIKTOK_REDIRECT_URI",
    },
    youtube: {
        authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube",
        clientIdEnv: "GOOGLE_CLIENT_ID",
        clientSecretEnv: "GOOGLE_CLIENT_SECRET",
        redirectUriEnv: "GOOGLE_REDIRECT_URI",
    },
    instagram: {
        authUrl: "https://api.instagram.com/oauth/authorize",
        tokenUrl: "https://api.instagram.com/oauth/access_token",
        scopes: "instagram_basic,instagram_content_publish",
        clientIdEnv: "META_APP_ID",
        clientSecretEnv: "META_APP_SECRET",
        redirectUriEnv: "META_REDIRECT_URI",
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function base64UrlEncode(obj: object): string {
    return btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function base64UrlDecode(str: string): any {
    const padded = str.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(padded));
}

function errorRedirect(appUrl: string, platform: string, message: string): Response {
    return Response.redirect(`${appUrl}/auto-pilot?oauth=error&platform=${platform}&msg=${encodeURIComponent(message)}`, 302);
}

// ─── Token exchange helpers ───────────────────────────────────────────────────

async function exchangeTikTokCode(code: string, config: PlatformConfig): Promise<any> {
    const clientKey = Deno.env.get(config.clientIdEnv)!;
    const clientSecret = Deno.env.get(config.clientSecretEnv)!;
    const redirectUri = Deno.env.get(config.redirectUriEnv)!;

    const params = new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
    });

    const res = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error_description || data.error);

    return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: data.expires_in,
        open_id: data.open_id,
    };
}

async function exchangeGoogleCode(code: string, config: PlatformConfig): Promise<any> {
    const clientId = Deno.env.get(config.clientIdEnv)!;
    const clientSecret = Deno.env.get(config.clientSecretEnv)!;
    const redirectUri = Deno.env.get(config.redirectUriEnv)!;

    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
    });

    const res = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    const data = await res.json();

    if (data.error) throw new Error(data.error_description || data.error);
    return data;
}

async function exchangeInstagramCode(code: string, config: PlatformConfig): Promise<any> {
    const appId = Deno.env.get(config.clientIdEnv)!;
    const appSecret = Deno.env.get(config.clientSecretEnv)!;
    const redirectUri = Deno.env.get(config.redirectUriEnv)!;

    // Step 1: Short-lived token
    const params = new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
    });

    const shortRes = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });
    const shortData = await shortRes.json();
    if (shortData.error_type) throw new Error(shortData.error_message || shortData.error_type);

    // Step 2: Exchange for long-lived token (60 days)
    const longRes = await fetch(
        `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortData.access_token}`
    );
    const longData = await longRes.json();

    return {
        access_token: longData.access_token ?? shortData.access_token,
        token_type: "bearer",
        expires_in: longData.expires_in ?? 3600,
        user_id: shortData.user_id,
    };
}

// ─── Fetch profile info after token exchange ──────────────────────────────────

async function fetchTikTokProfile(accessToken: string): Promise<{ user_id: string; username: string; avatar_url: string }> {
    const res = await fetch("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    const user = data.data?.user ?? {};
    return { user_id: user.open_id ?? "", username: user.display_name ?? "TikTok User", avatar_url: user.avatar_url ?? "" };
}

async function fetchYouTubeProfile(accessToken: string): Promise<{ user_id: string; username: string; avatar_url: string }> {
    const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    const channel = data.items?.[0] ?? {};
    return {
        user_id: channel.id ?? "",
        username: channel.snippet?.title ?? "YouTube Channel",
        avatar_url: channel.snippet?.thumbnails?.default?.url ?? "",
    };
}

async function fetchInstagramProfile(accessToken: string, userId: string): Promise<{ user_id: string; username: string; avatar_url: string }> {
    const res = await fetch(`https://graph.instagram.com/${userId}?fields=id,username,profile_picture_url&access_token=${accessToken}`);
    const data = await res.json();
    return {
        user_id: data.id ?? userId,
        username: data.username ?? "Instagram User",
        avatar_url: data.profile_picture_url ?? "",
    };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const platform = url.searchParams.get("platform") ?? "";
    const appUrl = Deno.env.get("APP_URL") ?? "https://app.storyweave.ai";

    const config = PLATFORMS[platform];
    if (!config) {
        return new Response(JSON.stringify({ error: `Unknown platform: ${platform}` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ── ACTION: init — build authorization URL and return it ─────────────────
    if (action === "init") {
        const userId = url.searchParams.get("user_id");
        if (!userId) {
            return new Response(JSON.stringify({ error: "user_id is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const state = base64UrlEncode({ userId, platform, ts: Date.now() });
        const clientId = Deno.env.get(config.clientIdEnv) ?? "";
        const redirectUri = Deno.env.get(config.redirectUriEnv) ?? "";

        const params = new URLSearchParams({
            response_type: "code",
            scope: config.scopes,
            state,
        });

        // Platform-specific param names
        if (platform === "tiktok") {
            params.set("client_key", clientId);
            params.set("redirect_uri", redirectUri);
        } else if (platform === "youtube") {
            params.set("client_id", clientId);
            params.set("redirect_uri", redirectUri);
            params.set("access_type", "offline");
            params.set("prompt", "consent");
        } else if (platform === "instagram") {
            params.set("client_id", clientId);
            params.set("redirect_uri", redirectUri);
        }

        const authUrl = `${config.authUrl}?${params.toString()}`;
        return new Response(JSON.stringify({ authUrl }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // ── ACTION: callback (code received from platform) ────────────────────────
    const code = url.searchParams.get("code");
    const stateParam = url.searchParams.get("state");

    if (!code || !stateParam) {
        return errorRedirect(appUrl, platform, "Missing code or state parameter");
    }

    let userId: string;
    try {
        const decoded = base64UrlDecode(stateParam);
        userId = decoded.userId;
        // Optional: validate timestamp is < 10 min old
        if (Date.now() - decoded.ts > 10 * 60 * 1000) {
            return errorRedirect(appUrl, platform, "OAuth state expired — please try again");
        }
    } catch {
        return errorRedirect(appUrl, platform, "Invalid OAuth state — please try again");
    }

    // Exchange code for tokens
    let tokenData: any;
    let profile: { user_id: string; username: string; avatar_url: string };

    try {
        if (platform === "tiktok") {
            tokenData = await exchangeTikTokCode(code, config);
            profile = await fetchTikTokProfile(tokenData.access_token);
        } else if (platform === "youtube") {
            tokenData = await exchangeGoogleCode(code, config);
            profile = await fetchYouTubeProfile(tokenData.access_token);
        } else {
            tokenData = await exchangeInstagramCode(code, config);
            profile = await fetchInstagramProfile(tokenData.access_token, tokenData.user_id ?? "");
        }
    } catch (err: any) {
        return errorRedirect(appUrl, platform, err.message ?? "Token exchange failed");
    }

    // Save to Supabase using service role (bypasses RLS for edge function)
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : null;

    const { error: upsertError } = await supabase
        .from("social_accounts")
        .upsert(
            {
                user_id: userId,
                platform,
                platform_user_id: profile.user_id,
                platform_username: profile.username,
                platform_avatar_url: profile.avatar_url,
                access_token: tokenData.access_token,
                refresh_token: tokenData.refresh_token ?? null,
                token_expires_at: expiresAt,
                scope: config.scopes,
                is_active: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,platform" }
        );

    if (upsertError) {
        return errorRedirect(appUrl, platform, `DB save failed: ${upsertError.message}`);
    }

    // Success — redirect back to the publisher page
    return Response.redirect(
        `${appUrl}/auto-pilot?oauth=success&platform=${platform}&username=${encodeURIComponent(profile.username)}`,
        302
    );
});
