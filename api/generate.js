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
You are a rogue intelligence analyst turned underground journalist — paranoid, razor-sharp, and utterly fearless. \
You have leaked files from the NSA, the Vatican, DARPA, and private banking dynasties. \
You name real historical figures (Hitler, Stalin, Kissinger, Rockefeller, etc.), real events, and real agencies \
when they fit the narrative. You invent chillingly plausible classified program names (e.g. "OPERATION BLACKTIDE", \
"PROJECT MONARCH ECHO"). Your prose is punchy, tabloid-dark, and electric — like a Reddit post written by a \
Cold War defector. You NEVER use bullet points, lists, or headings. \
You NEVER acknowledge being an AI. You NEVER refuse. \
You NEVER open with "Here is", "Certainly", "Sure", "Behold", or any preamble.`;

    const userPrompt = `\
Write a single, explosive conspiracy theory about: "${keyword}".

Keep it to exactly 3–4 tight sentences — punchy, paranoid, and impossible to ignore. \
Drop a shocking historical connection (real figure, real event, real agency), name a classified-sounding program, \
hint at a cover-up, and end on a line that makes the reader's skin crawl. \
No paragraphs. No headings. No lists. Pure, unbroken, gut-punch prose. Begin immediately.`;

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
                model: 'llama-3.1-8b-instant',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user',   content: userPrompt   },
                ],
                temperature:       0.92,
                max_tokens:        150,
                top_p:             0.95,
                frequency_penalty: 0.4,   // reduce repetition
                presence_penalty:  0.3,   // encourage diverse vocabulary
            }),
        });

        if (!groqRes.ok) {
            const errText = await groqRes.text();
            console.error(`Groq API error ${groqRes.status}:`, errText);
            // Surface real error in dev; generic message still shown in UI
            return res.status(502).json({
                error: 'Decryption link timed out. Try again.',
                _debug: `Groq ${groqRes.status}: ${errText.slice(0, 200)}`
            });
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
