async function testOllama() {
    const host = 'http://localhost:11434';
    const model = 'tinyllama';
    const prompt = 'Why is the sky blue? Answer in 10 words.';

    console.log(`Connecting to Ollama at ${host}...`);
    try {
        const response = await fetch(`${host}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model,
                prompt,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama error: ${response.statusText}`);
        }

        const data: any = await response.json();
        console.log('Ollama Response:', data.response);
    } catch (err) {
        console.error('Failed to connect to Ollama:', err);
    }
}

testOllama();
