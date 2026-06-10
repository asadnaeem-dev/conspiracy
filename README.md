# 🕯️ The Conspiracy Oracle

> *Speak a word, and the Oracle shall reveal what **they** don't want you to know.*

A dark, gothic web app that generates AI-powered conspiracy theories from a single word. Built with a Harry Potter-inspired aesthetic, haunted houses, flying bats, typewriter reveals, and ambient thunderstorms.

## ✨ Features

- 🔮 **AI-Generated Conspiracy Theories** — Powered by Groq (LLaMA 3)
- 🏚️ **Animated Haunted Houses** — Flickering windows, chimney smoke, subtle sway
- 👁️ **Custom Eye Cursor** — Mystical eye follows your every move
- ⚡ **Typewriter Reveal** — Theories appear letter by letter
- 🦇 **Flying Bats** — Triggered on each new theory
- ⛈️ **Ambient Sound** — Wind and thunder via Web Audio API
- 🌩️ **Random Lightning** — Flashes illuminate the darkness
- 📤 **Share as Image** — Download your theory as a styled PNG
- 🌫️ **Atmospheric Fog** — Drifting fog layers at the bottom
- ✨ **Floating Particles** — Golden dust motes rising upward

## 🚀 Deploy to Vercel

1. Push this repo to GitHub
2. Import it into [Vercel](https://vercel.com)
3. Add environment variable: `GROQ_API_KEY` (get one free at [console.groq.com](https://console.groq.com))
4. Deploy!

## 🛠️ Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Create .env file
echo "GROQ_API_KEY=your_key_here" > .env

# Run locally
vercel dev
```

## 📁 Structure

```
├── index.html          # Page structure
├── style.css           # Gothic design system & animations
├── script.js           # App logic, effects, sound
├── api/generate.js     # Vercel serverless Groq proxy
├── assets/             # Cursors, haunted house images
└── vercel.json         # Deployment config
```

## 🎨 Design

- **Fonts**: Cinzel Decorative, Cinzel, IM Fell English (Google Fonts)
- **Colors**: Deep blacks, wizard purples, parchment gold
- **Aesthetic**: Dark gothic Harry Potter meets occult mystery

---

*All theories are AI-generated fiction. The Oracle takes no responsibility for existential crises.*