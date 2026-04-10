import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Lambda configuration
// ---------------------------------------------------------------------------

const LAMBDA_FUNCTION_NAME = process.env.REMOTION_LAMBDA_FUNCTION_NAME;
const SERVE_URL            = process.env.REMOTION_SERVE_URL;
const REGION               = process.env.AWS_REGION ?? 'us-east-1';
const S3_BUCKET            = process.env.S3_BUCKET_NAME ?? 'storyweave-renders';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Renders a VideoState manifest.
 * Uses Remotion Lambda if REMOTION_LAMBDA_FUNCTION_NAME + REMOTION_SERVE_URL
 * are configured, otherwise falls back to the local Remotion CLI.
 *
 * @param jobId    - Unique job identifier (used for output filename)
 * @param manifest - Full VideoState object
 * @returns        - S3 URL (Lambda path) or local file path (CLI path)
 */
export const renderVideo = async (jobId: string, manifest: any): Promise<string> => {
    if (LAMBDA_FUNCTION_NAME && SERVE_URL) {
        return renderViaLambda(jobId, manifest);
    }
    return renderViaLocalCLI(jobId, manifest);
};

// ---------------------------------------------------------------------------
// Lambda path
// ---------------------------------------------------------------------------

const renderViaLambda = async (jobId: string, videoState: any): Promise<string> => {
    console.log(`[RenderService] Triggering Lambda render for job ${jobId}…`);

    // Dynamic import keeps @remotion/lambda optional — the local CLI fallback
    // still works if the package isn't installed.
    const { renderMediaOnLambda } = await import('@remotion/lambda/client');

    const outputKey = `renders/${jobId}.mp4`;

    await renderMediaOnLambda({
        region: REGION as any,
        functionName: LAMBDA_FUNCTION_NAME!,
        serveUrl: SERVE_URL!,
        composition: 'StoryWeaveVideo',
        inputProps: { videoState },
        codec: 'h264',
        imageFormat: 'jpeg',
        maxRetries: 1,
        framesPerLambda: 20,
        outName: {
            key: outputKey,
            bucketName: S3_BUCKET,
        },
    });

    const outputUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${outputKey}`;
    console.log(`[RenderService] Lambda render complete → ${outputUrl}`);
    return outputUrl;
};

// ---------------------------------------------------------------------------
// Local CLI fallback (development / no AWS)
// ---------------------------------------------------------------------------

const renderViaLocalCLI = async (jobId: string, manifest: any): Promise<string> => {
    const manifestPath = path.resolve(`../renderer/public/manifest_${jobId}.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`[RenderService] Starting local CLI render for job ${jobId}…`);

    const outputPath = path.resolve(`../renderer/out/${jobId}.mp4`);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const { stdout, stderr } = await execAsync(
        `npx remotion render src/index.tsx StoryWeaveVideo "${outputPath}" --props="${manifestPath}"`,
        { cwd: path.resolve('../renderer') }
    );

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log(`[RenderService] Local render complete → ${outputPath}`);
    return outputPath;
};
