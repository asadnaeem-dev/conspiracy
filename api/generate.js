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
        return res.status(500).json({ error: 'Oracle configuration error. API key missing.' });
    }

    const systemPrompt = `You are a mysterious, ancient oracle who speaks in dark, cryptic prose. You reveal hidden truths and forbidden knowledge that "they" don't want people to know. Your tone is dramatic, ominous, and slightly unhinged — like a prophet in a gothic cathedral. You always speak as if you are unveiling a centuries-old secret.`;

    const userPrompt = `Generate a single-paragraph conspiracy theory about: "${sanitizedWord}". Make it dramatic, spooky, and wildly imaginative. 2-4 sentences max. Do not use bullet points. Do not break character. Do not start with "Ah" or "Behold". Be creative and unpredictable.`;

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
                max_tokens: 200,
                top_p: 1,
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq API error:', response.status, errText);
            return res.status(502).json({ error: 'The Oracle\'s vision is clouded. Try again.' });
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
