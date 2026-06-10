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
    const classificationValue = document.getElementById('classification-value');
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
        // Load mute state from localStorage
        isMuted = localStorage.getItem('conspiracy_muted') === 'true';
        soundToggle.classList.toggle('muted', isMuted);
        soundIcon.textContent = isMuted ? '🔇' : '🔊';

        setupParticles();
        setupLightning();
        setupAmbientSound();
        initCastles();
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

        // Curtain reveal database click event
        const curtain = document.getElementById('cinematic-curtain');
        if (curtain) {
            curtain.addEventListener('click', revealDatabase);
        }

        // Parallax mouse movements for background castles
        document.addEventListener('mousemove', handleParallax);
    }

    // --- Background Castles Parallax ---
    function handleParallax(e) {
        if (!document.body.classList.contains('revealed')) return;
        
        const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

        const houseLeft = document.querySelector('.house-left');
        const houseRight = document.querySelector('.house-right');

        if (houseLeft) {
            houseLeft.style.transform = `translate(${x * 12}px, ${y * 8}px)`;
        }
        if (houseRight) {
            houseRight.style.transform = `translate(${x * -12}px, ${y * 8}px)`;
        }
    }

    // --- Decryption Interface Reveal ---
    function revealDatabase() {
        const curtain = document.getElementById('cinematic-curtain');
        if (!curtain || curtain.classList.contains('fading')) return;
        
        curtain.classList.add('fading');
        
        // 1. Initialize Web Audio Context
        initAudio();
        
        // 2. Immediate heavy thunder clap and lightning flash
        triggerLightning();
        playThunder();
        
        // 3. Fade screen black overlay
        curtain.style.opacity = '0';
        document.body.classList.add('revealed');
        
        // 4. Clean up curtain element
        setTimeout(() => {
            curtain.style.display = 'none';
        }, 3000);
        
        // 5. Start procedural pen-sketching drawing of castles
        startCastleSketching();
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

        const ballWrapper = document.querySelector('.crystal-ball-wrapper');
        if (ballWrapper) ballWrapper.classList.add('screen-shake');

        // Hide previous theory
        theorySection.hidden = true;

        try {
            const theory = await fetchTheory(word);
            
            // Random classification stamp
            const classifications = [
                'ARCHIVED FILE',
                'REDACTED RECORD',
                'UNSOLVED INCIDENT',
                'RESTRICTED DOSSIER',
                'ANOMALY REPORT',
                'LOST TESTIMONY'
            ];
            const classification = classifications[Math.floor(Math.random() * classifications.length)];

            // Set card content
            theoryWord.textContent = word.toUpperCase();
            if (classificationValue) {
                classificationValue.textContent = classification;
            }

            // Export card
            exportWord.textContent = word.toUpperCase();
            exportPlausibility.textContent = 'Classification: ' + classification;

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

            // Then run typewriter effect for the theory text
            await typewriterEffect(theoryText, theory);
            exportText.textContent = theory;

        } catch (err) {
            theorySection.hidden = false;
            theoryWord.textContent = 'ERROR';
            theoryText.textContent = 'The decryption connection was lost... ' + (err.message || 'Please try again.');
            theoryText.classList.remove('typing');
            if (classificationValue) classificationValue.textContent = 'ERROR';
        }

        // Reset UI
        isGenerating = false;
        btnText.style.display = '';
        btnLoading.style.display = 'none';
        generateBtn.disabled = false;
        crystalBall.classList.remove('pulsing');

        if (ballWrapper) ballWrapper.classList.remove('screen-shake');
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



    // --- Particles ---
    function setupParticles() {
        const count = 35;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');

            // Randomly color particles: 70% gold embers, 15% purple, 15% ice-blue
            const randColor = Math.random();
            if (randColor < 0.15) {
                p.classList.add('p-purple');
            } else if (randColor < 0.3) {
                p.classList.add('p-blue');
            }

            p.style.left = Math.random() * 100 + '%';
            p.style.animationDuration = (8 + Math.random() * 12) + 's';
            p.style.animationDelay = (Math.random() * 15) + 's';
            p.style.width = (1 + Math.random() * 2) + 'px';
            p.style.height = p.style.width;
            particlesContainer.appendChild(p);
        }
    }

    // --- Ambient Sound (Web Audio API) ---
    function initAudio() {
        if (audioCtx) return;
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            ambientGain = audioCtx.createGain();
            ambientGain.gain.setValueAtTime(isMuted ? 0 : 0.12, audioCtx.currentTime);
            ambientGain.connect(audioCtx.destination);

            // Wind noise
            createWindNoise();
            
            // Random thunder rumbles
            scheduleThunder();
        } catch (e) {
            console.error('Audio init failed:', e);
        }
    }

    function setupAmbientSound() {
        const startAudio = () => {
            initAudio();
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
        if (!audioCtx) return;
        
        const now = audioCtx.currentTime;
        const nextVal = isMuted ? 0 : (0.06 + Math.random() * 0.1);
        const duration = 3 + Math.random() * 5;
        
        try {
            gainNode.gain.setTargetAtTime(nextVal, now, duration);
        } catch (e) {}
        
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
        localStorage.setItem('conspiracy_muted', isMuted);
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
    function initCastles() {
        const houses = document.querySelectorAll('.house');
        houses.forEach((house) => {
            const paths = house.querySelectorAll('.house-svg path, .house-svg circle');
            paths.forEach((path) => {
                let length = 0;
                if (path.tagName === 'circle') {
                    length = 2 * Math.PI * parseFloat(path.getAttribute('r') || 110);
                } else {
                    try {
                        length = path.getTotalLength();
                    } catch (e) {
                        length = 300;
                    }
                }
                path.setAttribute('data-length', length);
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                path.style.transition = 'fill 2.5s ease-out, stroke 2.5s ease, stroke-width 2s ease';
            });
        });
    }

    function startCastleSketching() {
        const houses = document.querySelectorAll('.house');
        houses.forEach((house) => {
            sketchHouse(house);
        });
    }

    function sketchHouse(house) {
        const svg = house.querySelector('.house-svg');
        if (!svg) return;
        
        const svgNS = "http://www.w3.org/2000/svg";
        const pen = document.createElementNS(svgNS, "g");
        pen.setAttribute("class", "fountain-pen");
        pen.style.opacity = "0";
        pen.style.pointerEvents = "none";
        pen.style.transition = "opacity 0.25s ease";
        
        pen.innerHTML = `
            <!-- Nib metal -->
            <path d="M 0,0 L -3,-8 L -8,-20 L -4,-24 L 4,-24 L 8,-20 L 3,-8 Z" fill="#e2e8f0" stroke="#475569" stroke-width="0.8" />
            <!-- Nib slit -->
            <line x1="0" y1="0" x2="0" y2="-12" stroke="#0f172a" stroke-width="0.8" />
            <circle cx="0" cy="-12" r="0.8" fill="#0f172a" />
            <!-- Pen Body -->
            <path d="M -4,-24 L -5,-55 L 5,-55 L 4,-24 Z" fill="#1e1b4b" stroke="#4c1d95" stroke-width="0.8" />
            <!-- Gold accents -->
            <path d="M -4.5,-32 L 4.5,-32 L 4.5,-34 L -4.5,-34 Z" fill="#c9a84c" />
            <path d="M -5,-51 L 5,-51 L 5,-54 L -5,-54 Z" fill="#c9a84c" />
        `;
        svg.appendChild(pen);

        // Define drawing order of selectors
        const selectorOrder = [
            '.moon-glow',
            '.ground',
            '.tree.trunk',
            '.tree-branch',
            '.structure',
            '.roof-detail',
            '.porch',
            '.porch-column',
            '.steps',
            '.chimney',
            '.chimney-top',
            '.finial',
            '.fence-rail',
            '.fence-picket',
            '.shading',
            '.house-window'
        ];

        // Gather all matching paths in order
        const sortedPaths = [];
        selectorOrder.forEach(selector => {
            const elements = house.querySelectorAll(selector);
            elements.forEach(el => sortedPaths.push(el));
        });

        let currentPathIndex = 0;
        
        function drawNextPath() {
            if (currentPathIndex >= sortedPaths.length) {
                // Done drawing
                pen.style.opacity = '0';
                setTimeout(() => pen.remove(), 300);
                house.classList.add('active');
                return;
            }

            const path = sortedPaths[currentPathIndex];
            const length = parseFloat(path.getAttribute('data-length') || 0);

            if (length === 0) {
                currentPathIndex++;
                drawNextPath();
                return;
            }

            let pStart;
            if (path.tagName === 'circle') {
                pStart = { x: 165 - 110, y: 200 };
            } else {
                try {
                    pStart = path.getPointAtLength(0);
                } catch(e) {
                    pStart = { x: 165, y: 200 };
                }
            }

            // Move pen and show it
            pen.setAttribute("transform", `translate(${pStart.x}, ${pStart.y}) rotate(-30)`);
            pen.style.opacity = '1';

            // Variable speed: longer lines take slightly more time, short scribbles are fast
            const duration = Math.min(300, Math.max(50, length * 0.7));
            let startTime = null;

            function animate(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(1, elapsed / duration);
                
                const distance = length * progress;
                path.style.strokeDashoffset = length - distance;

                let pt;
                if (path.tagName === 'circle') {
                    const angle = progress * 2 * Math.PI;
                    pt = {
                        x: 165 + 110 * Math.cos(angle + Math.PI),
                        y: 200 + 110 * Math.sin(angle + Math.PI)
                    };
                } else {
                    try {
                        pt = path.getPointAtLength(distance);
                    } catch(e) {
                        pt = pStart;
                    }
                }

                // Tilt and slight write-wiggle
                const wiggle = Math.sin(progress * 30) * 3;
                pen.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${ -30 + wiggle })`);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    path.style.strokeDashoffset = '0';
                    currentPathIndex++;
                    setTimeout(drawNextPath, 10);
                }
            }

            requestAnimationFrame(animate);
        }

        // Delay starting the drawing slightly to let curtain fade begin
        setTimeout(drawNextPath, 200);
    }

    // --- Start ---
    init();
})();
