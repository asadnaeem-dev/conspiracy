# 🕯️ The Conspiracy Oracle 👁️

> *Speak a word, and the Oracle shall reveal what **they** don't want you to know.*

Step into the shadows with **The Conspiracy Oracle**, a dark, gothic, Harry Potter-inspired web application that decrypts classified "anomalies" and generates wild, AI-powered conspiracy theories from a single keyword.

With flickering haunted houses, flying bats, atmospheric fog, and a cinematic typewriter reveal, this application doesn't just generate text—it crafts an immersive, eerie experience.

---

## ✨ Features

- 🔮 **AI-Generated Conspiracy Theories** — Powered by Groq (LLaMA 3) for lightning-fast, creative, and unhinged lore.
- 🏚️ **Animated Haunted Houses** — Moonlit silhouettes, flickering windows, and chimney smoke that bring the background to life.
- ⚡ **Cinematic Typewriter Reveal** — Watch your theory unfold letter-by-letter like a classified document.
- 🦇 **Swarming Bats** — Trigger a swarm of bats on every new decryption.
- ⛈️ **Ambient Soundscapes** — Wind and thunder generated via Web Audio API for a truly haunted atmosphere.
- 🌩️ **Random Lightning Flashes** — Illumination from the digital storm.
- 📤 **Share Evidence** — Download your decrypted evidence as a beautifully styled PNG to share with the world.
- 🌫️ **Atmospheric Fog & Golden Particles** — Drifting fog layers and rising motes of dust that pull you deeper into the mystery.

---

## 🚀 Deployment (Vercel)

1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the following environment variable: `GROQ_API_KEY` *(Get yours free at [console.groq.com](https://console.groq.com))*
4. Deploy and reveal the truth!

---

## 🛠️ Local Development

Clone the repo and fire it up locally to experiment with the dark arts of web development.

```bash
# Install the Vercel CLI globally
npm i -g vercel

# Create your environment file
echo "GROQ_API_KEY=your_key_here" > .env

# Run the local development server
vercel dev
```

---

## 🗺️ What's Next? (Roadmap)

The Oracle's work is never done. Here is what we are currently working on next:
- [ ] **Multi-word Phrases & Complex Anomaly Decryption:** Expanding the input system to handle complex queries, sentences, and multi-variable anomalies.
- [ ] **Deeper Lore Integration:** Building an interconnected web of conspiracies so new theories reference past decryptions.
- [ ] **Interactive Easter Eggs:** Hidden secrets scattered throughout the UI, triggered by specific mysterious keywords.
- [ ] **Enhanced Audio Engine:** Evolving the soundscapes with adaptive music and more dynamic, unsettling sound effects.
- [ ] **User Accounts & "Archive" Feature:** Allowing agents to save, upvote, and catalog the best theories for future reference.

---

## 📁 Architecture

```
├── index.html          # Core structure & SVG assets
├── style.css           # Gothic styling, CSS variables & animations
├── script.js           # App logic, effects, API handling, sound
├── api/generate.js     # Vercel Serverless Function (Groq Proxy)
├── assets/             # Static assets
└── vercel.json         # Vercel routing configuration
```

## 🎨 Aesthetic Profile
- **Typography**: *Cinzel Decorative*, *Cinzel*, and *IM Fell English*
- **Palette**: Abyssal blacks, wizarding purples, and parchment golds.

---

*Disclaimer: All theories are strictly AI-generated fiction. The Oracle takes no responsibility for existential crises, sudden paranoia, or men in black appearing at your doorstep.*