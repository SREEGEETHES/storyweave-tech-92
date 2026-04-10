import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// S3 client — configured from environment variables
// ---------------------------------------------------------------------------

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const BUCKET = process.env.S3_BUCKET_NAME ?? 'storyweave-renders';

const s3 = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
    },
});

// ---------------------------------------------------------------------------
// Pre-signed upload URL (browser → S3 direct PUT)
// ---------------------------------------------------------------------------

/**
 * Returns a pre-signed PUT URL so the browser can upload an asset directly
 * to S3 without proxying through the API server.
 *
 * @param key         - S3 object key (e.g. `uploads/userId/filename.mp4`)
 * @param contentType - MIME type of the file being uploaded
 * @param expiresIn   - Seconds the URL remains valid (default: 15 minutes)
 */
export const getUploadPresignedUrl = async (
    key: string,
    contentType: string,
    expiresIn = 900
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> => {
    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    return {
        uploadUrl,
        key,
        publicUrl: getS3Url(key),
    };
};

// ---------------------------------------------------------------------------
// Pre-signed download URL (S3 → browser)
// ---------------------------------------------------------------------------

/**
 * Returns a pre-signed GET URL for accessing a private S3 object.
 *
 * @param key       - S3 object key
 * @param expiresIn - Seconds the URL remains valid (default: 1 hour)
 */
export const getDownloadPresignedUrl = async (
    key: string,
    expiresIn = 3600
): Promise<string> => {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return getSignedUrl(s3, command, { expiresIn });
};

// ---------------------------------------------------------------------------
// Server-side upload (orchestrator / post-render)
// ---------------------------------------------------------------------------

/**
 * Reads a local file and uploads it to S3.
 * Used by the orchestrator after a local Remotion render completes.
 *
 * @param localPath   - Absolute path to the local file
 * @param key         - Destination S3 key
 * @param contentType - MIME type (default: video/mp4)
 * @returns           - Public S3 URL of the uploaded object
 */
export const uploadFileToS3 = async (
    localPath: string,
    key: string,
    contentType = 'video/mp4'
): Promise<string> => {
    const body = await fs.readFile(localPath);
    await s3.send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: body,
            ContentType: contentType,
        })
    );
    return getS3Url(key);
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Builds the canonical public URL for an S3 key. */
export const getS3Url = (key: string): string =>
    `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
