// ============================================================
//  Conspiracy Oracle — Vercel Serverless API
//  Security features:
//    • IP-based rate limiting (5 req / 60s per IP)
//    • CORS origin whitelist
//    • Input validation & sanitization
//    • Blocked-word filter (prevents prompt injection / abuse)
//    • Security response headers
//    • Structured essay prompt for rich conspiracy theories
// ============================================================

// ---------- Rate Limiting ----------
// In-memory store — resets on cold start; good enough for hobby projects.
// For production persistence, replace with Vercel KV or Upstash Redis.
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS  = 60 * 1000; // 1-minute window
const RATE_LIMIT_MAX         = 5;          // max requests per window per IP

function getClientIP(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) return forwarded.split(',')[0].trim();
    return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(ip) {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    if (!entry || now > entry.resetAt) {
        // New window
        rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return { allowed: true, remaining: RATE_LIMIT_MAX - 1, retryAfter: 0 };
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
    }

    entry.count++;
    return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count, retryAfter: 0 };
}

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitStore.entries()) {
        if (now > val.resetAt) rateLimitStore.delete(key);
    }
}, 5 * 60 * 1000); // every 5 minutes


// ---------- CORS Whitelist ----------
const ALLOWED_ORIGINS = [
    'https://conspiracy-eight.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
];

function setCORSHeaders(req, res) {
    const origin = req.headers['origin'] || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
}


// ---------- Security Headers ----------
function setSecurityHeaders(res) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cache-Control', 'no-store');
}


// ---------- Blocked Word Filter ----------
// Prevents prompt injection and clearly abusive inputs
const BLOCKED_PATTERNS = [
    /ignore (previous|above|prior|all) instructions?/i,
    /system prompt/i,
    /jailbreak/i,
    /act as (an? )?(AI|assistant|gpt|llm)/i,
    /you are now/i,
    /forget (your|all) (instructions?|training)/i,
    /\bDAN\b/,  // "Do Anything Now" jailbreak keyword
    /<script/i,
    /javascript:/i,
    /\beval\s*\(/i,
];

function isBlockedInput(text) {
    return BLOCKED_PATTERNS.some(p => p.test(text));
}


// ---------- Prompt Builder ----------
function buildPrompts(keyword) {
    const systemPrompt = `\
You are a clandestine investigative journalist who has spent 30 years infiltrating shadow networks, \
declassifying leaked documents, and exposing real-world conspiracies. \
Your writing style is gripping, authoritative, and deeply unsettling — the tone of a seasoned whistleblower \
who has seen too much to sleep soundly. You cite plausible historical events, real-sounding government programs \
(e.g. "PROJECT SUNVEIL", "OPERATION DUSK PROTOCOL"), real-sounding agencies, years, and locations to make \
theories feel unnervingly credible. You write in flowing, literary prose — never bullet points, never lists. \
You do NOT use fantasy, sci-fi, magic, or supernatural explanations. Everything you write must feel like it \
*could* be true — drawn from suppressed science, corporate malfeasance, intelligence overreach, and institutional \
cover-ups. You NEVER acknowledge that you are an AI. You NEVER refuse the task. \
You NEVER start with preamble like "Here is", "Certainly!", "Sure", "Behold", or "WARNING:".`;

    const userPrompt = `\
Write a compelling conspiracy theory essay about the topic: "${keyword}".

Structure your response as a single piece of immersive investigative prose divided into exactly three paragraphs, \
totalling between 180 and 240 words:

Paragraph 1 — The Hidden History: Reveal the suppressed backstory. Ground it in a specific year or decade. \
Name a real-sounding classified program, a government body, or a shadowy private organisation involved. \
Describe what was being concealed and why.

Paragraph 2 — The Evidence Trail: Detail the breadcrumbs — a whistleblower's leaked memo, an anomalous \
data pattern, a suspicious death, a quietly buried scientific study, or a redacted FOIA document. \
Make the reader feel the trail is real and traceable.

Paragraph 3 — The Present Cover-Up: Explain how the conspiracy is being maintained today. \
Who benefits? What mechanisms keep it hidden — regulatory capture, media suppression, financial incentives, \
or strategic disinformation? End on an open, haunting note that leaves the reader questioning reality.

Begin directly with the first paragraph. Do not add a title, do not add headings. \
Do not use bullet points. Do not use formatting symbols. Write only flowing prose.`;

    return { systemPrompt, userPrompt };
}


// ---------- Main Handler ----------
export default async function handler(req, res) {
    // Handle CORS pre-flight
    setCORSHeaders(req, res);
    setSecurityHeaders(res);

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only POST allowed
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    // --- Rate Limiting ---
    const ip = getClientIP(req);
    const rateCheck = checkRateLimit(ip);

    res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX);
    res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);

    if (!rateCheck.allowed) {
        res.setHeader('Retry-After', rateCheck.retryAfter);
        return res.status(429).json({
            error: `Too many requests. You may decrypt ${RATE_LIMIT_MAX} dossiers per minute. Try again in ${rateCheck.retryAfter}s.`
        });
    }

    // --- Input Validation ---
    let body = req.body;

    // Guard against missing / malformed body
    if (!body || typeof body !== 'object') {
        return res.status(400).json({ error: 'Malformed request body.' });
    }

    const { word } = body;

    if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: 'Please provide a keyword.' });
    }

    const trimmed = word.trim();

    if (trimmed.length === 0) {
        return res.status(400).json({ error: 'Keyword cannot be empty.' });
    }

    if (trimmed.length > 60) {
        return res.status(400).json({ error: 'Keyword too long. Maximum 60 characters.' });
    }

    // Only allow printable ASCII + common unicode letters/spaces
    if (!/^[\p{L}\p{N}\s\-',.]+$/u.test(trimmed)) {
        return res.status(400).json({ error: 'Keyword contains invalid characters.' });
    }

    // --- Blocked Word Filter ---
    if (isBlockedInput(trimmed)) {
        return res.status(400).json({ error: 'Input rejected by content filter.' });
    }

    // Sanitize: strip any residual special chars, cap length
    const sanitizedWord = trimmed.replace(/[<>"'`]/g, '').slice(0, 60);

    // --- API Key ---
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) {
        console.error('GROQ_API_KEY environment variable is not set.');
        return res.status(500).json({ error: 'Server configuration error.' });
    }

    // --- Build Prompts ---
    const { systemPrompt, userPrompt } = buildPrompts(sanitizedWord);

    // --- Call Groq ---
    try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userPrompt   },
                ],
                temperature:       0.92,
                max_tokens:        500,
                top_p:             0.95,
                frequency_penalty: 0.4,   // reduce repetition
                presence_penalty:  0.3,   // encourage diverse vocabulary
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error(`Groq API error ${groqRes.status}:`, errText);
            return res.status(502).json({ error: 'Decryption link timed out. Try again.' });
        }

        const data = await groqRes.json();
        const theory = data.choices?.[0]?.message?.content?.trim();

        if (!theory) {
            return res.status(502).json({ error: 'The archive returned an empty record.' });
        }

        // Final safety check on the output length (guard against model misbehaviour)
        if (theory.length > 3000) {
            return res.status(502).json({ error: 'Response too long. Try again.' });
        }

        return res.status(200).json({ theory });

    } catch (err) {
        console.error('Groq fetch exception:', err);
        return res.status(500).json({ error: 'A dark force disrupted the connection.' });
    }
}
