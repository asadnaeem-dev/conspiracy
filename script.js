/* ============================================
   THE CONSPIRACY ORACLE — APP LOGIC
   ============================================ */

(function () {
    'use strict';

    // --- DOM Elements ---
    const wordInput = document.getElementById('word-input');
    const generateBtn = document.getElementById('generate-btn');
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    const crystalBall = document.getElementById('crystal-ball');
    const theorySection = document.getElementById('theory-section');
    const theoryWord = document.getElementById('theory-word');
    const theoryText = document.getElementById('theory-text');
    const plausibilityValue = document.getElementById('plausibility-value');
    const shareBtn = document.getElementById('share-btn');
    const soundToggle = document.getElementById('sound-toggle');
    const soundIcon = soundToggle.querySelector('.sound-icon');
    const lightningOverlay = document.getElementById('lightning-overlay');
    const batsContainer = document.getElementById('bats-container');
    const particlesContainer = document.getElementById('particles');

    // Export card elements
    const exportWord = document.getElementById('export-word');
    const exportText = document.getElementById('export-text');
    const exportPlausibility = document.getElementById('export-plausibility');

    // --- State ---
    let isGenerating = false;
    let audioCtx = null;
    let ambientGain = null;
    let isMuted = false;
    let ambientNodes = [];

    // --- Initialize ---
    function init() {
        setupParticles();
        setupLightning();
        setupAmbientSound();
        setupHouseAnimations();
        setupEventListeners();
    }

    // --- Event Listeners ---
    function setupEventListeners() {
        generateBtn.addEventListener('click', handleGenerate);
        wordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleGenerate();
        });
        shareBtn.addEventListener('click', handleShare);
        soundToggle.addEventListener('click', toggleSound);

        // Mystical eye cursor hover response over interactive crystal ball
        crystalBall.addEventListener('mouseenter', startWhisper);
        crystalBall.addEventListener('mouseleave', stopWhisper);
    }

    // --- Generate Theory ---
    async function handleGenerate() {
        const word = wordInput.value.trim();
        if (!word || isGenerating) return;

        isGenerating = true;

        // UI: loading state
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        generateBtn.disabled = true;
        crystalBall.classList.add('pulsing');

        // Hide previous theory
        theorySection.hidden = true;

        try {
            const theory = await fetchTheory(word);
            const plausibility = Math.floor(Math.random() * 18) + 1; // 1–18%

            // Set card content
            theoryWord.textContent = word.toUpperCase();
            plausibilityValue.textContent = '0%';
            
            // Get progress bar element
            const plausibilityBar = document.getElementById('plausibility-bar');
            plausibilityBar.style.width = '0%';

            // Export card
            exportWord.textContent = word.toUpperCase();
            exportPlausibility.textContent = 'Forbidden Truth Level: ' + plausibility + '%';

            // Show theory section
            theorySection.hidden = false;
            theorySection.style.animation = 'none';
            // Force reflow
            void theorySection.offsetHeight;
            theorySection.style.animation = '';

            // Trigger bats
            spawnBats();

            // Flash lightning + play thunder sound
            triggerLightning();
            playThunder();

            // Animate plausibility meter first (Forbidden Truth Level)
            await animatePlausibilityMeter(plausibility, plausibilityBar);

            // Then run typewriter effect for the theory text
            await typewriterEffect(theoryText, theory);
            exportText.textContent = theory;

        } catch (err) {
            theorySection.hidden = false;
            theoryWord.textContent = 'ERROR';
            theoryText.textContent = 'The Oracle\'s vision is clouded... ' + (err.message || 'Please try again.');
            theoryText.classList.remove('typing');
            plausibilityValue.textContent = '???';
            const plausibilityBar = document.getElementById('plausibility-bar');
            if (plausibilityBar) plausibilityBar.style.width = '0%';
        }

        // Reset UI
        isGenerating = false;
        btnText.style.display = '';
        btnLoading.style.display = 'none';
        generateBtn.disabled = false;
        crystalBall.classList.remove('pulsing');
    }

    // --- Fetch Theory from Groq ---
    async function fetchTheory(word) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.error || 'The Oracle is unreachable.');
        }

        const data = await response.json();
        return data.theory;
    }

    // --- Typewriter Effect ---
    function typewriterEffect(element, text) {
        return new Promise((resolve) => {
            element.textContent = '';
            element.classList.add('typing');
            let i = 0;
            const speed = 25; // ms per character

            function type() {
                if (i < text.length) {
                    element.textContent += text.charAt(i);
                    i++;
                    setTimeout(type, speed);
                } else {
                    element.classList.remove('typing');
                    resolve();
                }
            }

            type();
        });
    }

    // --- Bats Animation ---
    function spawnBats() {
        batsContainer.innerHTML = '';
        const batCount = 6;

        for (let i = 0; i < batCount; i++) {
            const bat = document.createElement('div');
            bat.classList.add('bat');
            bat.textContent = '🦇';

            // Random start position (from center-ish)
            const startX = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
            const startY = window.innerHeight / 2 + (Math.random() - 0.5) * 100;
            bat.style.left = startX + 'px';
            bat.style.top = startY + 'px';

            // Random flight direction
            const dx = (Math.random() - 0.5) * 600;
            const dy = -(Math.random() * 400 + 100);
            bat.style.setProperty('--bat-dx', dx + 'px');
            bat.style.setProperty('--bat-dy', dy + 'px');

            bat.style.animationDelay = (i * 0.15) + 's';
            bat.style.fontSize = (1 + Math.random() * 0.8) + 'rem';

            batsContainer.appendChild(bat);
        }

        // Clean up after animation
        setTimeout(() => {
            batsContainer.innerHTML = '';
        }, 3500);
    }

    // --- Lightning ---
    function setupLightning() {
        function randomFlash() {
            const delay = (Math.random() * 25000) + 15000; // 15–40s
            setTimeout(() => {
                triggerLightning();
                randomFlash();
            }, delay);
        }
        randomFlash();
    }

    function triggerLightning() {
        lightningOverlay.classList.remove('flash');
        void lightningOverlay.offsetHeight;
        lightningOverlay.classList.add('flash');

        // Frantic house window flickering during lightning
        const houses = document.querySelectorAll('.house');
        houses.forEach(house => house.classList.add('lightning-flicker'));
        
        setTimeout(() => {
            houses.forEach(house => house.classList.remove('lightning-flicker'));
        }, 1200);
    }

    // --- Interactive Procedural Synth Effects ---
    function playTick() {
        if (!audioCtx || isMuted) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(140, audioCtx.currentTime);
            // pitch drop for a natural mechanical click/tick sound
            osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.04);

            gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } catch (e){}
    }

    let whisperNode = null;
    let whisperGain = null;

    function startWhisper() {
        if (!audioCtx || isMuted) return;
        try {
            stopWhisper();

            whisperGain = audioCtx.createGain();
            whisperGain.gain.setValueAtTime(0, audioCtx.currentTime);
            // fade in ghostly whisper
            whisperGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.5);

            // Generate noise buffer
            const bufferSize = audioCtx.sampleRate * 2;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }

            const source = audioCtx.createBufferSource();
            source.buffer = buffer;
            source.loop = true;

            // Bandpass filter to create resonant ghostly sweeping noise
            const filter = audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 10;
            filter.frequency.setValueAtTime(250, audioCtx.currentTime);

            source.connect(filter);
            filter.connect(whisperGain);
            whisperGain.connect(audioCtx.destination);

            source.start();
            whisperNode = source;

            // Start sweeping modulation
            modulateWhisper(filter);
        } catch (e) {
            console.error('Whisper failed:', e);
        }
    }

    function modulateWhisper(filterNode) {
        if (!whisperNode || !audioCtx) return;
        try {
            const now = audioCtx.currentTime;
            const nextFreq = 300 + Math.random() * 500;
            const nextQ = 7 + Math.random() * 8;
            filterNode.frequency.exponentialRampToValueAtTime(nextFreq, now + 1.2);
            filterNode.Q.exponentialRampToValueAtTime(nextQ, now + 1.2);
            
            setTimeout(() => {
                if (whisperNode) modulateWhisper(filterNode);
            }, 1200);
        } catch (e){}
    }

    function stopWhisper() {
        if (whisperGain && audioCtx) {
            try {
                const now = audioCtx.currentTime;
                whisperGain.gain.cancelScheduledValues(now);
                whisperGain.gain.setValueAtTime(whisperGain.gain.value, now);
                whisperGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            } catch (e){}
        }
        setTimeout(() => {
            if (whisperNode) {
                try {
                    whisperNode.stop();
                } catch(e){}
                whisperNode = null;
            }
        }, 400);
    }

    // --- Forbidden Truth Bar Animation ---
    function animatePlausibilityMeter(targetVal, barElement) {
        return new Promise((resolve) => {
            let currentVal = 0;
            const duration = 1200; // ms
            const intervalTime = 30; // ms
            const steps = duration / intervalTime;
            const increment = targetVal / steps;
            
            const timer = setInterval(() => {
                currentVal += increment;
                if (currentVal >= targetVal) {
                    currentVal = targetVal;
                    clearInterval(timer);
                    
                    plausibilityValue.textContent = Math.round(currentVal) + '%';
                    barElement.style.width = Math.round(currentVal) + '%';
                    
                    // Final confirmation tick
                    playTick();
                    
                    setTimeout(resolve, 300); // short pause
                } else {
                    plausibilityValue.textContent = Math.round(currentVal) + '%';
                    barElement.style.width = Math.round(currentVal) + '%';
                    playTick();
                }
            }, intervalTime);
        });
    }

    // --- Particles ---
    function setupParticles() {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = (Math.random() * 15) + 's';
            p.style.width = (1 + Math.random() * 2) + 'px';
            p.style.height = p.style.width;
            particlesContainer.appendChild(p);
        }
    }

    // --- Ambient Sound (Web Audio API) ---
    function setupAmbientSound() {
        // Create audio on first user interaction (browser policy)
        const startAudio = () => {
            if (audioCtx) return;
            
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            ambientGain = audioCtx.createGain();
            ambientGain.gain.value = 0.12;
            ambientGain.connect(audioCtx.destination);

            // Wind noise
            createWindNoise();
            
            // Random thunder rumbles
            scheduleThunder();

            document.removeEventListener('click', startAudio);
            document.removeEventListener('keydown', startAudio);
        };

        document.addEventListener('click', startAudio);
        document.addEventListener('keydown', startAudio);
    }

    function createWindNoise() {
        if (!audioCtx) return;

        const bufferSize = audioCtx.sampleRate * 4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        // Brown noise (deeper, more wind-like)
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.02 * white)) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        // Low-pass filter for wind effect
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        filter.Q.value = 0.5;

        source.connect(filter);
        filter.connect(ambientGain);
        source.start();

        ambientNodes.push(source);

        // Modulate the wind volume for natural feel
        modulateWind(ambientGain);
    }

    function modulateWind(gainNode) {
        if (!audioCtx || isMuted) return;
        
        const now = audioCtx.currentTime;
        const nextVal = 0.06 + Math.random() * 0.1;
        const duration = 3 + Math.random() * 5;
        
        gainNode.gain.setTargetAtTime(nextVal, now, duration);
        
        setTimeout(() => modulateWind(gainNode), (duration * 1000) + 500);
    }

    function scheduleThunder() {
        if (!audioCtx) return;

        const delay = (Math.random() * 30000) + 20000; // 20–50s
        setTimeout(() => {
            if (!isMuted && audioCtx) {
                playThunder();
                triggerLightning();
            }
            scheduleThunder();
        }, delay);
    }

    function playThunder() {
        if (!audioCtx) return;

        const duration = 2 + Math.random() * 2;
        const bufferSize = audioCtx.sampleRate * duration;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);

        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + (0.01 * white)) / 1.01;
            lastOut = data[i];
            data[i] *= 5;
        }

        const source = audioCtx.createBufferSource();
        source.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 200;

        const thunderGain = audioCtx.createGain();
        thunderGain.gain.value = 0;

        source.connect(filter);
        filter.connect(thunderGain);
        thunderGain.connect(audioCtx.destination);

        // Envelope: quick attack, slow decay
        const now = audioCtx.currentTime;
        thunderGain.gain.setValueAtTime(0, now);
        thunderGain.gain.linearRampToValueAtTime(0.25, now + 0.1);
        thunderGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        source.start();
        source.stop(now + duration);
    }

    function toggleSound() {
        isMuted = !isMuted;
        soundToggle.classList.toggle('muted', isMuted);
        soundIcon.textContent = isMuted ? '🔇' : '🔊';

        if (ambientGain) {
            ambientGain.gain.setTargetAtTime(
                isMuted ? 0 : 0.12,
                audioCtx.currentTime,
                0.3
            );
        }
    }

    // --- Share as Image ---
    async function handleShare() {
        const exportCard = document.getElementById('export-card');
        
        // Temporarily show export card for rendering
        exportCard.style.left = '0';
        exportCard.style.position = 'absolute';
        exportCard.style.zIndex = '-1';
        exportCard.style.opacity = '1';

        try {
            const canvas = await html2canvas(exportCard, {
                backgroundColor: '#0d0b14',
                scale: 2,
                logging: false,
                useCORS: true
            });

            // Download
            const link = document.createElement('a');
            const word = theoryWord.textContent.toLowerCase();
            const date = new Date().toISOString().slice(0, 10);
            link.download = `conspiracy_${word}_${date}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Also copy to clipboard if supported
            try {
                canvas.toBlob(async (blob) => {
                    if (blob && navigator.clipboard && navigator.clipboard.write) {
                        await navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]);
                    }
                });
            } catch (clipErr) {
                // Clipboard copy is optional
            }

        } catch (err) {
            console.error('Share failed:', err);
        }

        // Hide export card again
        exportCard.style.left = '-9999px';
        exportCard.style.position = 'fixed';
    }

    // --- House Pen-Stroke Animations ---
    function setupHouseAnimations() {
        const houses = document.querySelectorAll('.house');
        
        houses.forEach((house) => {
            const paths = house.querySelectorAll('.house-svg path');
            
            paths.forEach((path) => {
                const length = path.getTotalLength();
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                
                // Set animation parameters based on path categories for hand-sketched staggering
                let delay = 0.2;
                let duration = 3.0;
                
                if (path.classList.contains('ground')) {
                    delay = 0.2;
                    duration = 1.2;
                } else if (path.classList.contains('structure')) {
                    delay = 1.0;
                    duration = 2.2;
                } else if (path.classList.contains('roof-detail') || path.classList.contains('chimney') || path.classList.contains('porch')) {
                    delay = 1.8;
                    duration = 1.8;
                } else if (path.classList.contains('shading') || path.classList.contains('finial')) {
                    delay = 2.6;
                    duration = 1.2;
                } else if (path.classList.contains('house-window')) {
                    delay = 2.8;
                    duration = 1.0;
                } else if (path.classList.contains('tree') || path.classList.contains('tree-branch')) {
                    delay = 1.4;
                    duration = 2.6;
                } else if (path.classList.contains('fence-rail') || path.classList.contains('fence-picket')) {
                    delay = 2.2;
                    duration = 1.6;
                }
                
                path.style.transition = `stroke-dashoffset ${duration}s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s, opacity ${duration}s ease ${delay}s`;
            });
        });

        // Trigger the drawing after rendering has caught up
        setTimeout(() => {
            houses.forEach((house) => {
                const paths = house.querySelectorAll('.house-svg path');
                paths.forEach((path) => {
                    path.style.strokeDashoffset = '0';
                });
                
                // Once drawing transition is finished, active fills and glows
                setTimeout(() => {
                    house.classList.add('active');
                }, 4000);
            });
        }, 150);
    }

    // --- Start ---
    init();
})();
