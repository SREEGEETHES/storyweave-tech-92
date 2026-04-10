import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------------------------------------------------------------
// S3 client (lazy init — only if credentials are present)
// ---------------------------------------------------------------------------

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const BUCKET = process.env.S3_BUCKET_NAME ?? 'storyweave-renders';

let _s3: S3Client | null = null;

function getS3Client(): S3Client {
    if (!_s3) {
        _s3 = new S3Client({
            region: REGION,
            credentials: {
                accessKeyId:     process.env.AWS_ACCESS_KEY_ID     ?? '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
            },
        });
    }
    return _s3;
}

// ---------------------------------------------------------------------------
// uploadFile
// ---------------------------------------------------------------------------

/**
 * Uploads a local file to S3.
 * Falls back to a mock URL if AWS credentials are not configured (dev mode).
 *
 * @param filePath - Absolute local path to the file
 * @param bucket   - S3 bucket name (defaults to S3_BUCKET_NAME env var)
 * @param fileName - Destination S3 key
 * @returns        - Public S3 URL of the uploaded object
 */
export const uploadFile = async (
    filePath: string,
    bucket: string,
    fileName: string
): Promise<string> => {
    const targetBucket = bucket || BUCKET;

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        console.warn(
            `[StorageService] AWS credentials not set — skipping upload for ${fileName}`
        );
        return `https://${targetBucket}.s3.${REGION}.amazonaws.com/${fileName}`;
    }

    console.log(`[StorageService] Uploading ${fileName} → s3://${targetBucket}/…`);

    const body = await fs.readFile(filePath);
    await getS3Client().send(
        new PutObjectCommand({
            Bucket: targetBucket,
            Key:    fileName,
            Body:   body,
        })
    );

    const url = `https://${targetBucket}.s3.${REGION}.amazonaws.com/${fileName}`;
    console.log(`[StorageService] Upload complete → ${url}`);
    return url;
};
