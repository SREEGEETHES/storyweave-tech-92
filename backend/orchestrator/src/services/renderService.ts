import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export const renderVideo = async (jobId: string, manifest: any) => {
    const manifestPath = path.resolve(`../renderer/public/manifest_${jobId}.json`);
    await fs.writeFile(manifestPath, JSON.stringify(manifest));

    console.log(`Starting render for job ${jobId}...`);

    // In a real system, we'd use @remotion/lambda or a dedicated render farm.
    // Here we run it locally using the CLI.
    const outputPath = path.resolve(`../renderer/out/${jobId}.mp4`);

    try {
        const { stdout, stderr } = await execAsync(
            `npx remotion render src/index.tsx Video ${outputPath} --props=${manifestPath}`,
            { cwd: path.resolve('../renderer') }
        );
        console.log(stdout);
        if (stderr) console.error(stderr);

        return outputPath;
    } catch (err) {
        console.error('Render failed:', err);
        throw err;
    }
};
