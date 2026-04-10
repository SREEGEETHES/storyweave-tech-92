import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.NEON_DATABASE_URL) {
    console.warn('[Neon] NEON_DATABASE_URL is not set — DB operations will fail.');
}

export const sql = neon(process.env.NEON_DATABASE_URL ?? 'postgresql://localhost/storyweave');
