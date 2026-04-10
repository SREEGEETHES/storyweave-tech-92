import {
    renderMediaOnLambda,
    getRenderProgress,
    speculateFunctionName,
} from '@remotion/lambda/client';
import type { VideoState } from '../types/videoState.js';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// Lambda configuration — read from environment
// ---------------------------------------------------------------------------

const REGION = (process.env.AWS_REGION ?? 'us-east-1') as Parameters<typeof renderMediaOnLambda>[0]['region'];

/**
 * Remotion speculateFunctionName generates the deterministic Lambda function
 * name that `npx remotion lambda functions deploy` would have created.
 * Override with REMOTION_LAMBDA_FUNCTION_NAME if you used a custom name.
 */
const FUNCTION_NAME =
    process.env.REMOTION_LAMBDA_FUNCTION_NAME ??
    speculateFunctionName({
        memorySizeInMb: 2048,
        diskSizeInMb: 2048,
        timeoutInSeconds: 900,
    });

/**
 * REMOTION_SERVE_URL is the S3 URL of the bundled Remotion site.
 * Deploy via: `npx remotion lambda sites create`
 */
const SERVE_URL = process.env.REMOTION_SERVE_URL ?? '';

const S3_BUCKET = process.env.S3_BUCKET_NAME ?? 'storyweave-renders';

// ---------------------------------------------------------------------------
// Public interface
// ---------------------------------------------------------------------------

export interface LambdaRenderResult {
    renderId: string;
    bucketName: string;
    outputKey: string;
}

export interface LambdaProgressResult {
    overallProgress: number;   // 0–100
    done: boolean;
    outputFile: string | null;
    errors: string[];
}

// ---------------------------------------------------------------------------
// triggerLambdaRender
// ---------------------------------------------------------------------------

/**
 * Kicks off a Remotion Lambda render for a given VideoState.
 *
 * The output is written to `renders/{jobId}.mp4` in the configured S3 bucket.
 * An optional webhook is triggered on completion if RENDER_WEBHOOK_URL is set.
 */
export const triggerLambdaRender = async (
    jobId: string,
    videoState: VideoState
): Promise<LambdaRenderResult> => {
    if (!SERVE_URL) {
        throw new Error(
            'REMOTION_SERVE_URL is not configured. ' +
            'Run `npx remotion lambda sites create` and set the env var.'
        );
    }

    const outputKey = `renders/${jobId}.mp4`;

    const webhookConfig =
        process.env.RENDER_WEBHOOK_URL
            ? {
                  url: process.env.RENDER_WEBHOOK_URL,
                  secret: process.env.RENDER_WEBHOOK_SECRET ?? null,
              }
            : undefined;

    const result = await renderMediaOnLambda({
        region: REGION,
        functionName: FUNCTION_NAME,
        serveUrl: SERVE_URL,
        composition: 'StoryWeaveVideo',
        inputProps: { videoState },
        codec: 'h264',
        imageFormat: 'jpeg',
        maxRetries: 1,
        framesPerLambda: 20,
        downloadBehavior: { type: 'play-in-browser' },
        outName: {
            key: outputKey,
            bucketName: S3_BUCKET,
        },
        webhook: webhookConfig,
    });

    return {
        renderId: result.renderId,
        bucketName: result.bucketName,
        outputKey,
    };
};

// ---------------------------------------------------------------------------
// getLambdaRenderProgress
// ---------------------------------------------------------------------------

/**
 * Polls the Remotion Lambda progress endpoint for a running render.
 *
 * `overallProgress` is normalised to 0–100 (Lambda reports 0–1).
 */
export const getLambdaRenderProgress = async (
    renderId: string,
    bucketName: string
): Promise<LambdaProgressResult> => {
    const progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: FUNCTION_NAME,
        region: REGION,
    });

    return {
        overallProgress: Math.round((progress.overallProgress ?? 0) * 100),
        done: progress.done,
        outputFile: progress.outputFile ?? null,
        errors: (progress.errors ?? []).map((e: any) => e.message ?? String(e)),
    };
};
