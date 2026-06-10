// Vercel Serverless Function — Groq Proxy
// Keeps the API key hidden from the browser

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { word } = req.body || {};

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
        return res.status(400).json({ error: 'Please provide a word.' });
    }

    const sanitizedWord = word.trim().slice(0, 50);

    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
        return res.status(500).json({ error: 'Decryption configuration error. API key missing.' });
    }

    const systemPrompt = `You are a highly classified government database decryption system. You extract redacted dossiers and decrypted documents. Your tone is clinical, serious, cold, and mysterious. Avoid fantasy tropes (no wizards, no fortune telling, no crystal ball talk). Speak of historical cover-ups, scientific experiments, missing persons, classified programs (e.g. Project MK-Ultra, Operation Paperclip), or industrial conspiracies. Include realistic details (e.g., years like 1968, specific research labs, codenames like 'PROJECT AXIOM'). The theory must feel unsettlingly realistic and absurdly believable.`;

    const userPrompt = `Generate a single continuous paragraph classified dossier entry about: "${sanitizedWord}".
    The entry must be between 100 and 180 words.
    Do not use bullet points or lists. Do not start with introductory phrases like "Dossier decrypted:", "Here is the theory:", "Behold," or "WARNING:".
    Start immediately with the historical or technical evidence. Make it feel like an authentic leaked report.`;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.9,
                max_tokens: 350,
                top_p: 1,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq API error:', response.status, errText);
            return res.status(502).json({ error: 'Decryption link timeout. Try again.' });
        }

        const data = await response.json();
        const theory = data.choices?.[0]?.message?.content?.trim();

        if (!theory) {
            return res.status(502).json({ error: 'The Oracle returned silence.' });
        }

        return res.status(200).json({ theory });

    } catch (err) {
        console.error('Groq fetch error:', err);
        return res.status(500).json({ error: 'A dark force disrupted the Oracle.' });
    }
}
