import { generateScript } from '../services/scriptService.js';

async function testFullFlow() {
    const vision = 'A documentary style video about how salt was once as valuable as gold.';
    const duration = '30s';

    console.log(`--- Starting Full Flow Test ---`);
    console.log(`Vision: "${vision}"`);
    console.log(`Target Duration: ${duration}`);

    try {
        const script = await generateScript(vision, duration);
        console.log(`\n--- Generation Successful ---`);
        console.log(`Title: ${script.title}`);
        console.log(`Template: ${script.templateId}`);
        console.log(`Style: ${script.styleId}`);
        console.log(`Blueprint Version: ${script.blueprintVersion}`);
        console.log(`\nScenes:`);
        script.scenes.forEach((scene, i) => {
            console.log(`\n[Scene ${i + 1}] (${scene.duration}s)`);
            console.log(`Visual: ${scene.visualPrompt}`);
            console.log(`Voiceover: ${scene.voiceoverText}`);
        });
    } catch (err) {
        console.error(`\n--- Generation Failed ---`);
        console.error(err);
    }
}

testFullFlow();
