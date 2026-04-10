import type { VideoState } from '@/types';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RenderStatus = 'QUEUED' | 'RENDERING' | 'UPLOADING' | 'COMPLETED' | 'FAILED';

export interface StartRenderResponse {
    jobId: string;
    renderId: string;
    bucketName: string;
    status: RenderStatus;
}

export interface RenderProgressResponse {
    jobId: string;
    status: RenderStatus;
    progress: number;   // 0–100
    outputUrl?: string;
    error?: string;
}

// ---------------------------------------------------------------------------
// startRender
// ---------------------------------------------------------------------------

/**
 * Submits a VideoState to the backend and starts a Remotion Lambda render.
 * Returns immediately with a jobId for polling.
 */
export const startRender = async (videoState: VideoState): Promise<StartRenderResponse> => {
    const res = await fetch(`${API_BASE}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoState),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((err as any).error ?? `Render request failed: ${res.status}`);
    }

    return res.json() as Promise<StartRenderResponse>;
};

// ---------------------------------------------------------------------------
// getRenderProgress
// ---------------------------------------------------------------------------

/**
 * Polls the backend for the latest render progress.
 * Call on an interval (e.g. every 3 s) until status === 'COMPLETED' | 'FAILED'.
 */
export const getRenderProgress = async (jobId: string): Promise<RenderProgressResponse> => {
    const res = await fetch(`${API_BASE}/render/${encodeURIComponent(jobId)}/progress`);

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error((err as any).error ?? `Progress check failed: ${res.status}`);
    }

    return res.json() as Promise<RenderProgressResponse>;
};

// ---------------------------------------------------------------------------
// getUploadPresignedUrl
// ---------------------------------------------------------------------------

/**
 * Requests a pre-signed S3 PUT URL from the backend so the browser can upload
 * an asset directly to S3 without proxying through the API server.
 */
export const getUploadPresignedUrl = async (
    fileName: string,
    contentType: string
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> => {
    const params = new URLSearchParams({ fileName, contentType });
    const res = await fetch(`${API_BASE}/render/presign?${params}`);

    if (!res.ok) {
        throw new Error(`Failed to get upload URL: HTTP ${res.status}`);
    }

    return res.json() as Promise<{ uploadUrl: string; key: string; publicUrl: string }>;
};

// ---------------------------------------------------------------------------
// uploadAssetToS3
// ---------------------------------------------------------------------------

/**
 * Uploads a File directly to S3 using a pre-signed PUT URL.
 * Reports upload progress via the optional callback (0–100).
 *
 * @returns The public S3 URL of the uploaded object
 */
export const uploadAssetToS3 = async (
    file: File,
    onProgress?: (percent: number) => void
): Promise<string> => {
    const { uploadUrl, publicUrl } = await getUploadPresignedUrl(file.name, file.type);

    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', file.type);

        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                }
            };
        }

        xhr.onload = () => {
            if (xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`S3 upload failed: HTTP ${xhr.status}`));
            }
        };
        xhr.onerror = () => reject(new Error('S3 upload network error'));
        xhr.send(file);
    });

    return publicUrl;
};
