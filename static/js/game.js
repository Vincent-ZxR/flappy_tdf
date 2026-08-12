/**
 * Air Liquide - H2 Panda Flappy Truck
 * HTML5 Canvas Game Engine
 */

class SoundEngine {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.bgMusicTimer = null;
        this.bgMusicPlaying = false;
        this.musicStep = 0;
        this.noiseBuffer = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.createNoiseBuffer();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1; // 1 second buffer
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    playJump() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Tone component
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);

        // Gas Hiss noise (Propulsion Hydrogène Psssh!)
        if (this.noiseBuffer) {
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
            filter.Q.value = 2.5;

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.22, now);
            noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

            noiseSource.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + 0.14);
        }
    }

    playRecharge() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Gas filling pressure noise (Remplissage H2)
        if (this.noiseBuffer) {
            const noiseSource = this.ctx.createBufferSource();
            noiseSource.buffer = this.noiseBuffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(600, now);
            filter.frequency.exponentialRampToValueAtTime(3600, now + 0.32);

            const noiseGain = this.ctx.createGain();
            noiseGain.gain.setValueAtTime(0.25, now);
            noiseGain.gain.linearRampToValueAtTime(0.01, now + 0.35);

            noiseSource.connect(filter);
            filter.connect(noiseGain);
            noiseGain.connect(this.ctx.destination);

            noiseSource.start(now);
            noiseSource.stop(now + 0.35);
        }

        // Victory chime chord
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.18);
        });
    }

    playScore() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playHit() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
    }

    startMusic() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                if (this.enabled && !this.bgMusicPlaying) {
                    this.startMusic();
                }
            });
            return;
        }

        if (this.bgMusicPlaying) return;
        this.bgMusicPlaying = true;
        this.musicStep = 0;

        // Upbeat chiptune Air Liquide melody notes
        const C4 = 261.63, E4 = 329.63, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99;
        const melody = [
            C4, E4, G4, C5,  E5, G4, C5, E5,
            A4, C5, E5, A4,  G4, B4, D5, G5,
            C4, E4, G4, C5,  E5, D5, C5, G4,
            A4, F4, G4, B4,  C5, C5, C5, 0
        ];

        const stepDuration = 0.14; // 16th note rhythm

        const playNextStep = () => {
            if (!this.bgMusicPlaying || !this.enabled || !this.ctx) return;

            const now = this.ctx.currentTime;
            const note = melody[this.musicStep % melody.length];

            if (note > 0) {
                // Tropical Marimba / Calypso Synth
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine'; // Soft wooden marimba tone
                osc.frequency.setValueAtTime(note, now);

                gain.gain.setValueAtTime(0.14, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 0.9);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start(now);
                osc.stop(now + stepDuration * 0.9);

                // Tropical Wooden Percussion / Bass Accent
                if (this.musicStep % 2 === 0) {
                    const bassOsc = this.ctx.createOscillator();
                    const bassGain = this.ctx.createGain();

                    bassOsc.type = 'triangle';
                    bassOsc.frequency.setValueAtTime(note / 2, now);

                    bassGain.gain.setValueAtTime(0.16, now);
                    bassGain.gain.exponentialRampToValueAtTime(0.001, now + stepDuration * 1.2);

                    bassOsc.connect(bassGain);
                    bassGain.connect(this.ctx.destination);

                    bassOsc.start(now);
                    bassOsc.stop(now + stepDuration * 1.2);
                }
            }

            this.musicStep++;
            this.bgMusicTimer = setTimeout(playNextStep, stepDuration * 1000);
        };

        playNextStep();
    }

    stopMusic() {
        this.bgMusicPlaying = false;
        if (this.bgMusicTimer) {
            clearTimeout(this.bgMusicTimer);
            this.bgMusicTimer = null;
        }
    }
}

class FlappyH2Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.audio = new SoundEngine();

        // UI Elements
        this.hud = document.getElementById('hud');
        this.scoreDisplay = document.getElementById('score-display');
        this.fuelPercentage = document.getElementById('fuel-percentage');
        this.fuelBarFill = document.getElementById('fuel-bar-fill');
        this.startScreen = document.getElementById('start-screen');
        this.gameoverScreen = document.getElementById('gameover-screen');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.playerPseudoInput = document.getElementById('player-pseudo');
        this.pseudoError = document.getElementById('pseudo-error');
        this.animalBtns = document.querySelectorAll('.animal-btn');
        this.selectedAvatarBadge = document.getElementById('selected-avatar-badge');

        this.deathReason = document.getElementById('death-reason');
        this.finalScore = document.getElementById('final-score');
        this.bestScoreDisplay = document.getElementById('best-score');
        this.startBestScoreDisplay = document.getElementById('start-best-score');
        this.rechargeCountDisplay = document.getElementById('recharge-count');
        this.rechargeToast = document.getElementById('recharge-toast');
        this.overflowToast = document.getElementById('overflow-toast');
        this.smrToast = document.getElementById('smr-toast');
        this.mosquitoToast = document.getElementById('mosquito-toast');
        this.blurTimeout = null;
        this.soundBtn = document.getElementById('sound-btn');

        // Buttons
        this.startBtn = document.getElementById('start-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.homeBtn = document.getElementById('home-btn');
        this.leaderboardBtn = document.getElementById('leaderboard-btn');
        this.gameoverLeaderboardBtn = document.getElementById('gameover-leaderboard-btn');
        this.closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');

        // Game Configuration
        this.width = 400;
        this.height = 640;

        this.state = 'START'; // START, PLAYING, GAMEOVER
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('al_h2_best_score') || '0', 10);
        this.rechargeCount = 0;

        // Load saved pseudo and animal avatar
        this.sessionPseudo = localStorage.getItem('al_h2_player_pseudo') || '';
        if (this.sessionPseudo && this.playerPseudoInput) {
            this.playerPseudoInput.value = this.sessionPseudo;
        }

        this.selectedAnimal = localStorage.getItem('al_h2_player_animal') || 'panda';
        this.selectedEmoji = localStorage.getItem('al_h2_player_emoji') || '🐼';

        // Set initial animal selection state
        this.selectAnimal(this.selectedAnimal, this.selectedEmoji);

        // Player (Air Liquide Tanker Truck)
        this.truck = {
            x: 80,
            y: 280,
            width: 68,
            height: 38,
            velocity: 0,
            gravity: 0.38,
            jumpImpulse: -7.2,
            rotation: 0,
            fuel: 100,
            fuelDepletionRate: 0.055 // Smooth fuel depletion (~30s per tank)
        };

        // Environment & Speed
        this.groundHeight = 80;
        this.groundOffset = 0;
        this.baseGameSpeed = 2.4;
        this.gameSpeed = this.baseGameSpeed;
        this.clouds = [];
        this.turbines = [];

        // Game Entities
        this.obstacles = [];
        this.h2Stations = [];
        this.mosquitoes = [];
        this.particles = [];
        this.frameCount = 0;
        this.obstacleSpawnInterval = 140;

        this.init();
    }

    init() {
        if (this.startBestScoreDisplay) {
            this.startBestScoreDisplay.textContent = this.bestScore;
        }
        this.bindEvents();
        this.initBackgroundElements();
        this.fetchUserProfile();
        this.loop();
    }

    async fetchUserProfile() {
        try {
            const res = await fetch('/api/me');
            if (res.ok) {
                const data = await res.json();
                this.userEmail = data.email || '';
                if (data.pseudo) {
                    this.sessionPseudo = data.pseudo;
                    if (this.playerPseudoInput) {
                        this.playerPseudoInput.value = data.pseudo;
                    }
                    localStorage.setItem('al_h2_player_pseudo', data.pseudo);
                } else {
                    this.sessionPseudo = '';
                    if (this.playerPseudoInput) {
                        this.playerPseudoInput.value = '';
                        this.playerPseudoInput.placeholder = 'Entre ton pseudo';
                    }
                }
                if (data.avatar) {
                    const matchedBtn = Array.from(this.animalBtns || []).find(b => b.getAttribute('data-emoji') === data.avatar);
                    const animalName = matchedBtn ? matchedBtn.getAttribute('data-animal') : 'panda';
                    this.selectAnimal(animalName, data.avatar);
                }
            }
        } catch (e) {
            console.error('Failed to fetch user profile:', e);
        }
    }

    selectAnimal(animal, emoji) {
        this.selectedAnimal = animal;
        this.selectedEmoji = emoji;
        localStorage.setItem('al_h2_player_animal', animal);
        localStorage.setItem('al_h2_player_emoji', emoji);

        if (this.animalBtns) {
            this.animalBtns.forEach(btn => {
                if (btn.getAttribute('data-animal') === animal) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        if (this.selectedAvatarBadge) {
            this.selectedAvatarBadge.textContent = this.selectedEmoji + '🚛';
        }
    }

    bindEvents() {
        // Animal mosaic buttons selection
        if (this.animalBtns) {
            this.animalBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const animal = btn.getAttribute('data-animal');
                    const emoji = btn.getAttribute('data-emoji');
                    this.selectAnimal(animal, emoji);
                });
            });
        }

        // Clear pseudo error on typing
        if (this.playerPseudoInput) {
            this.playerPseudoInput.addEventListener('input', () => {
                this.hidePseudoError();
            });

            // Enter key on pseudo input starts the game
            this.playerPseudoInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.startGame();
                }
            });
        }

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                // Prevent jumping if typing in pseudo input
                if (document.activeElement === this.playerPseudoInput) return;
                e.preventDefault();
                this.handleAction();
            }
        });

        // Touch & Click controls on Canvas
        const handleCanvasInput = (e) => {
            if (e.target === this.playerPseudoInput ||
                e.target.closest('.animal-btn') ||
                e.target === this.startBtn ||
                e.target === this.restartBtn ||
                e.target === this.homeBtn ||
                e.target === this.leaderboardBtn ||
                e.target === this.gameoverLeaderboardBtn ||
                e.target === this.closeLeaderboardBtn ||
                e.target === this.soundBtn) return;

            e.preventDefault();
            this.audio.init();
            this.handleAction();
        };

        this.canvas.addEventListener('touchstart', handleCanvasInput, { passive: false });
        this.canvas.addEventListener('mousedown', handleCanvasInput);

        // Buttons
        if (this.startBtn) {
            this.startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.audio.init();
                this.startGame();
            });
        }

        if (this.restartBtn) {
            this.restartBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.audio.init();
                this.startGame();
            });
        }

        if (this.homeBtn) {
            this.homeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.audio.init();
                this.showStartScreen();
            });
        }

        // Leaderboard buttons
        if (this.leaderboardBtn) {
            this.leaderboardBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showLeaderboard();
            });
        }

        if (this.gameoverLeaderboardBtn) {
            this.gameoverLeaderboardBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showLeaderboard();
            });
        }

        if (this.closeLeaderboardBtn) {
            this.closeLeaderboardBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideLeaderboard();
            });
        }

        // Sound toggle
        if (this.soundBtn) {
            this.soundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.audio.enabled = !this.audio.enabled;
                this.soundBtn.textContent = this.audio.enabled ? '🔊' : '🔇';
                if (this.audio.enabled) {
                    if (this.state === 'PLAYING') this.audio.startMusic();
                } else {
                    this.audio.stopMusic();
                }
            });
        }
    }

    showPseudoError(msg) {
        if (this.pseudoError) {
            this.pseudoError.textContent = msg;
            this.pseudoError.classList.remove('hidden');
        }
    }

    hidePseudoError() {
        if (this.pseudoError) {
            this.pseudoError.classList.add('hidden');
        }
    }

    getPseudo() {
        return this.sessionPseudo || (this.playerPseudoInput ? this.playerPseudoInput.value.trim().substring(0, 15) : '');
    }

    async showLeaderboard() {
        this.leaderboardScreen.classList.remove('hidden');
        this.leaderboardList.innerHTML = '<li class="loading">Chargement du classement...</li>';

        try {
            const res = await fetch('/api/scores');
            if (!res.ok) throw new Error('Network response error');
            const data = await res.json();

            this.leaderboardList.innerHTML = '';
            if (data.length === 0) {
                this.leaderboardList.innerHTML = '<li style="justify-content: center; color: #94a3b8;">Classement vide. Soyez le premier !</li>';
                return;
            }

            data.forEach((entry, idx) => {
                const li = document.createElement('li');
                if (idx === 0) li.classList.add('rank-1');
                if (idx === 1) li.classList.add('rank-2');
                if (idx === 2) li.classList.add('rank-3');

                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                const avatarEmoji = entry.avatar || '🐼';

                li.innerHTML = `
                    <div class="player-name">
                        <span>${medal}</span>
                        <span>${avatarEmoji} ${this.escapeHtml(entry.pseudo)}</span>
                    </div>
                    <div class="player-score">${entry.score} pts</div>
                `;
                this.leaderboardList.appendChild(li);
            });
        } catch (err) {
            this.leaderboardList.innerHTML = '<li>Erreur de chargement du classement.</li>';
        }
    }

    hideLeaderboard() {
        this.leaderboardScreen.classList.add('hidden');
    }

    showStartScreen() {
        this.clearBlur();
        this.state = 'START';
        this.audio.stopMusic();
        if (this.hud) this.hud.classList.add('hidden');
        if (this.gameoverScreen) this.gameoverScreen.classList.add('hidden');
        if (this.leaderboardScreen) this.leaderboardScreen.classList.add('hidden');
        if (this.startScreen) this.startScreen.classList.remove('hidden');
        if (this.startBestScoreDisplay) {
            this.startBestScoreDisplay.textContent = this.bestScore;
        }
        this.truck.y = 260;
        this.truck.velocity = 0;
        this.truck.rotation = 0;
    }

    escapeHtml(str) {
        return (str || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    async submitScore(score, recharges) {
        if (score <= 0) return;
        const pseudo = this.getPseudo();
        if (!pseudo) return;

        try {
            await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: pseudo,
                    avatar: this.selectedEmoji,
                    score: score,
                    recharges: recharges
                })
            });
        } catch (e) {
            console.error('Failed to submit score:', e);
        }
    }

    initBackgroundElements() {
        // Generate jungle mist clouds
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: 20 + Math.random() * 120,
                radius: 25 + Math.random() * 25,
                speed: 0.2 + Math.random() * 0.3
            });
        }

        // Generate background jungle palm trees & giant foliage
        this.jungleTrees = [];
        for (let i = 0; i < 6; i++) {
            this.jungleTrees.push({
                x: i * 75 + Math.random() * 20,
                y: this.height - this.groundHeight,
                height: 70 + Math.random() * 35,
                type: i % 2 === 0 ? 'palm' : 'fern'
            });
        }
    }

    handleAction() {
        if (this.state === 'START') {
            this.startGame();
        } else if (this.state === 'PLAYING') {
            this.truck.velocity = this.truck.jumpImpulse;
            this.audio.playJump();
            this.spawnExhaustParticles();
        }
    }

    async startGame() {
        this.audio.init();

        const inputVal = this.playerPseudoInput ? this.playerPseudoInput.value.trim() : '';

        if (!inputVal) {
            this.showPseudoError("⚠️ Veuillez saisir un pseudo avant de jouer !");
            if (this.playerPseudoInput) this.playerPseudoInput.focus();
            return;
        }

        // Save & validate pseudo mapping against backend
        try {
            const res = await fetch('/api/user/pseudo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pseudo: inputVal,
                    avatar: this.selectedEmoji
                })
            });
            const data = await res.json();
            if (!res.ok || data.status === 'error') {
                this.showPseudoError(`⚠️ ${data.message || 'Ce pseudo est déjà utilisé par un autre joueur !'}`);
                if (this.playerPseudoInput) this.playerPseudoInput.focus();
                return;
            }
        } catch (err) {
            console.error('Update pseudo error:', err);
        }

        // Pseudo validated
        this.hidePseudoError();
        this.clearBlur();
        this.sessionPseudo = inputVal;
        localStorage.setItem('al_h2_player_pseudo', inputVal);

        this.state = 'PLAYING';
        this.score = 0;
        this.rechargeCount = 0;
        this.scoreDisplay.textContent = '0';

        this.gameSpeed = this.baseGameSpeed;

        this.truck.y = 260;
        this.truck.velocity = 0;
        this.truck.rotation = 0;
        this.truck.fuel = 100;

        this.obstacles = [];
        this.h2Stations = [];
        this.mosquitoes = [];
        this.particles = [];
        this.frameCount = 0;

        this.startScreen.classList.add('hidden');
        this.gameoverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');

        this.updateFuelBar();
        this.audio.startMusic();
    }

    gameOver(reason) {
        this.clearBlur();
        this.state = 'GAMEOVER';
        this.audio.stopMusic();
        this.audio.playHit();

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('al_h2_best_score', this.bestScore.toString());
        }

        // Send score to leaderboard
        this.submitScore(this.score, this.rechargeCount);

        this.deathReason.textContent = reason;
        this.finalScore.textContent = this.score;
        this.bestScoreDisplay.textContent = this.bestScore;
        this.rechargeCountDisplay.textContent = this.rechargeCount;

        this.hud.classList.add('hidden');
        this.gameoverScreen.classList.remove('hidden');

        // Create crash explosion particles
        for (let i = 0; i < 25; i++) {
            this.particles.push({
                x: this.truck.x + this.truck.width / 2,
                y: this.truck.y + this.truck.height / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                radius: Math.random() * 5 + 2,
                color: Math.random() > 0.5 ? '#00a3e0' : '#e30613',
                life: 30
            });
        }
    }

    spawnObstaclePair() {
        const gap = 185; // Generous clearance gap
        const minHeight = 65;
        const maxHeight = this.height - this.groundHeight - gap - minHeight;
        const topHeight = minHeight + Math.random() * (maxHeight - minHeight);

        // Top obstacle: vine_monkey or hanging_spider
        const topTypes = ['vine_monkey', 'hanging_spider'];
        const selectedTopType = topTypes[Math.floor(Math.random() * topTypes.length)];

        // Bottom obstacle: snake, linde_smr, or crocodile
        const bottomTypes = ['snake', 'linde_smr', 'crocodile'];
        const selectedBottomType = bottomTypes[Math.floor(Math.random() * bottomTypes.length)];

        this.obstacles.push({
            x: this.width + 10,
            width: 60,
            topHeight: topHeight,
            bottomY: topHeight + gap,
            bottomHeight: this.height - this.groundHeight - (topHeight + gap),
            topType: selectedTopType,
            bottomType: selectedBottomType,
            time: Math.random() * 100,
            freqTop: 0.03 + Math.random() * 0.015,
            ampTop: 6 + Math.random() * 4, // Gentle oscillation (6-10px)
            freqBottom: 0.03 + Math.random() * 0.015,
            ampBottom: 6 + Math.random() * 4, // Gentle oscillation (6-10px)
            hitSMR: false,
            passed: false
        });

        // Spawn Air Liquide H2 Refueling Station every ~2 obstacle gaps
        if (this.frameCount > 60 && Math.random() < 0.75) {
            this.h2Stations.push({
                baseX: this.width + 110,
                x: this.width + 110,
                baseY: topHeight + gap / 2 - 25,
                y: topHeight + gap / 2 - 25,
                width: 45,
                height: 50,
                time: Math.random() * 100,
                freqY: 0.04,
                ampY: 12,
                freqX: 0.03,
                ampX: 10,
                collected: false
            });
        }
    }

    spawnExhaustParticles() {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: this.truck.x - 5,
                y: this.truck.y + this.truck.height - 10 + (Math.random() - 0.5) * 8,
                vx: -(Math.random() * 3 + 2),
                vy: (Math.random() - 0.5) * 2,
                radius: Math.random() * 4 + 2,
                color: 'rgba(255, 255, 255, 0.8)',
                life: 20
            });
        }
    }

    showRechargeToast() {
        if (this.rechargeToast) {
            this.rechargeToast.classList.remove('hidden');
            setTimeout(() => {
                if (this.rechargeToast) this.rechargeToast.classList.add('hidden');
            }, 1500);
        }
    }

    showSMRToast() {
        if (this.smrToast) {
            this.smrToast.classList.remove('hidden');
            setTimeout(() => {
                if (this.smrToast) this.smrToast.classList.add('hidden');
            }, 1800);
        }
    }

    showOverflowToast() {
        if (this.overflowToast) {
            this.overflowToast.classList.remove('hidden');
            setTimeout(() => {
                if (this.overflowToast) this.overflowToast.classList.add('hidden');
            }, 2200);
        }
    }

    showMosquitoToast() {
        if (this.mosquitoToast) {
            this.mosquitoToast.classList.remove('hidden');
            setTimeout(() => {
                if (this.mosquitoToast) this.mosquitoToast.classList.add('hidden');
            }, 2000);
        }
    }

    triggerBlur() {
        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
        }
        if (this.canvas) {
            this.canvas.classList.add('blurry');
        }
        this.blurTimeout = setTimeout(() => {
            if (this.canvas) {
                this.canvas.classList.remove('blurry');
            }
        }, 2000);
    }

    clearBlur() {
        if (this.blurTimeout) {
            clearTimeout(this.blurTimeout);
            this.blurTimeout = null;
        }
        if (this.canvas) {
            this.canvas.classList.remove('blurry');
        }
    }

    updateFuelBar() {
        const roundedFuel = Math.max(0, Math.min(100, Math.round(this.truck.fuel)));
        this.fuelPercentage.textContent = `${roundedFuel}%`;
        this.fuelBarFill.style.width = `${roundedFuel}%`;

        if (roundedFuel < 30) {
            this.fuelBarFill.classList.add('warning');
        } else {
            this.fuelBarFill.classList.remove('warning');
        }
    }

    update() {
        // Parallax background updates
        this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            if (cloud.x + cloud.radius < -20) {
                cloud.x = this.width + 20;
                cloud.y = 20 + Math.random() * 120;
            }
        });

        if (this.jungleTrees) {
            this.jungleTrees.forEach(tree => {
                tree.x -= this.gameSpeed * 0.3;
                if (tree.x < -60) {
                    tree.x = this.width + 20 + Math.random() * 30;
                }
            });
        }

        this.groundOffset = (this.groundOffset + this.gameSpeed) % 24;

        if (this.state !== 'PLAYING') {
            // Idle hover animation for start screen
            if (this.state === 'START') {
                this.truck.y = 260 + Math.sin(Date.now() / 250) * 8;
            }
            return;
        }

        this.frameCount++;

        // 1. Truck Physics
        this.truck.velocity += this.truck.gravity;
        this.truck.y += this.truck.velocity;

        // Rotation based on velocity
        this.truck.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 6, this.truck.velocity * 0.07));

        // 2. Fuel Autonomie Mechanics
        this.truck.fuel -= this.truck.fuelDepletionRate;
        this.updateFuelBar();

        if (this.truck.fuel <= 0) {
            this.gameOver("⚡ Panne d'hydrogène H₂ ! Pensez aux stations Air Liquide !");
            return;
        }

        // Check ground/sky collision
        if (this.truck.y + this.truck.height >= this.height - this.groundHeight) {
            this.gameOver("💥 Crash dans la jungle !");
            return;
        }
        if (this.truck.y <= 0) {
            this.truck.y = 0;
            this.truck.velocity = 0;
        }

        // 3. Spawn Obstacles
        if (this.frameCount % this.obstacleSpawnInterval === 0) {
            this.spawnObstaclePair();
        }

        // 4. Update Obstacles & Check Collisions
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.x -= this.gameSpeed;
            obs.time += 1;

            // Oscillating movement in respective zones
            const topMove = Math.sin(obs.time * obs.freqTop) * obs.ampTop;
            const currentTopHeight = obs.topHeight + topMove;

            const bottomMove = Math.cos(obs.time * obs.freqBottom) * obs.ampBottom;
            const currentBottomY = obs.bottomY + bottomMove;

            // Score increment & smooth speed progression (capped at 4.0)
            if (!obs.passed && obs.x + obs.width < this.truck.x) {
                obs.passed = true;
                this.score++;
                this.scoreDisplay.textContent = this.score.toString();
                this.audio.playScore();

                // Smooth speed acceleration capped at 8.0
                this.gameSpeed = Math.min(8.0, this.gameSpeed * 1.025);
            }

            // Hitbox checks (forgiving padding)
            const padding = 7;
            const truckBox = {
                left: this.truck.x + padding,
                right: this.truck.x + this.truck.width - padding,
                top: this.truck.y + padding,
                bottom: this.truck.y + this.truck.height - padding
            };

            // Top Obstacle collision (Vine + Monkey OR Hanging Spider)
            if (truckBox.right > obs.x && truckBox.left < obs.x + obs.width) {
                if (truckBox.top < currentTopHeight) {
                    let reason = "🐒 Attaqué par le singe suspendu à sa liane !";
                    if (obs.topType === 'hanging_spider' || obs.topType === 'spider') {
                        reason = "🕷️ Attaqué par l'araignée géante de la jungle !";
                    }
                    this.gameOver(reason);
                    return;
                }

                // Bottom Obstacle collision (Snake / Crocodile / Linde SMR)
                if (truckBox.bottom > currentBottomY) {
                    if (obs.bottomType === 'snake') {
                        this.gameOver("🐍 Mordu par le serpent géant de la jungle !");
                        return;
                    } else if (obs.bottomType === 'crocodile') {
                        this.gameOver("🐊 Dévoré par le crocodile de la jungle !");
                        return;
                    } else if (obs.bottomType === 'linde_smr') {
                        if (!obs.hitSMR) {
                            obs.hitSMR = true;
                            this.truck.fuel = Math.max(0, this.truck.fuel * 0.5);
                            this.updateFuelBar();
                            this.audio.playHit();
                            this.showSMRToast();

                            if (this.truck.fuel <= 0) {
                                this.gameOver("⚡ Stock d'hydrogène épuisé suite à l'impact avec l'Unité Linde SMR !");
                                return;
                            }
                        }
                    }
                }
            }

            // Remove off-screen obstacles
            if (obs.x + obs.width < -100) {
                this.obstacles.splice(i, 1);
            }
        }

        // 4b. Spawn & Update Fast Flying Mosquitoes 🦟
        if (this.frameCount % 150 === 0 && Math.random() < 0.75) {
            this.mosquitoes.push({
                x: this.width + 30,
                y: 50 + Math.random() * (this.height - this.groundHeight - 110),
                speed: this.gameSpeed * 1.55 + Math.random() * 0.6,
                time: Math.random() * 100,
                freq: 0.12,
                amp: 12
            });
        }

        for (let i = this.mosquitoes.length - 1; i >= 0; i--) {
            const m = this.mosquitoes[i];
            m.x -= m.speed;
            m.time += 1;
            const currentY = m.y + Math.sin(m.time * m.freq) * m.amp;

            const padding = 6;
            const truckBox = {
                left: this.truck.x + padding,
                right: this.truck.x + this.truck.width - padding,
                top: this.truck.y + padding,
                bottom: this.truck.y + this.truck.height - padding
            };

            if (truckBox.right > m.x - 12 && truckBox.left < m.x + 12 &&
                truckBox.bottom > currentY - 12 && truckBox.top < currentY + 12) {
                this.audio.playHit();
                this.triggerBlur();
                this.showMosquitoToast();
                this.mosquitoes.splice(i, 1);
                continue;
            }

            if (m.x < -50) {
                this.mosquitoes.splice(i, 1);
            }
        }

        // 5. Update Air Liquide H2 Stations & Recharging (+10% or Explosion if >100%)
        for (let i = this.h2Stations.length - 1; i >= 0; i--) {
            const st = this.h2Stations[i];
            st.time += 1;

            // Movement in sine pattern (horizontal and vertical oscillation)
            st.baseX -= this.gameSpeed;
            st.x = st.baseX + Math.sin(st.time * st.freqX) * st.ampX;
            st.y = st.baseY + Math.cos(st.time * st.freqY) * st.ampY;

            // Collision with H2 Station portal
            if (!st.collected) {
                const truckCenterX = this.truck.x + this.truck.width / 2;
                const truckCenterY = this.truck.y + this.truck.height / 2;

                if (Math.abs(truckCenterX - (st.x + st.width / 2)) < 36 &&
                    Math.abs(truckCenterY - (st.y + st.height / 2)) < 38) {
                    st.collected = true;

                    const newFuel = this.truck.fuel + 10;
                    if (newFuel > 100) {
                        this.truck.fuel = 100;
                        this.updateFuelBar();
                        this.audio.playHit();
                        this.showOverflowToast();
                        this.gameOver("💥 Explosion du réservoir ! Surcharge d'hydrogène (>100%) !");
                        return;
                    }

                    this.truck.fuel = newFuel;
                    this.rechargeCount++;
                    this.audio.playRecharge();
                    this.showRechargeToast();

                    // Sparkle particles
                    for (let p = 0; p < 15; p++) {
                        this.particles.push({
                            x: st.x + st.width / 2,
                            y: st.y + st.height / 2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            radius: Math.random() * 4 + 2,
                            color: '#00d2ff',
                            life: 25
                        });
                    }
                }
            }

            if (st.x + st.width < -50) {
                this.h2Stations.splice(i, 1);
            }
        }

        // 6. Update Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.radius = Math.max(0, p.radius - 0.1);

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // 1. Tropical Jungle Background Gradient
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#022c22');
        skyGrad.addColorStop(0.4, '#064e3b');
        skyGrad.addColorStop(0.8, '#047857');
        skyGrad.addColorStop(1, '#059669');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Filtered Sunlight Rays
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(255, 255, 200, 0.05)';
        for (let r = 0; r < 4; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(r * 110 + 20, 0);
            this.ctx.lineTo(r * 110 + 70, 0);
            this.ctx.lineTo(r * 110 + 130, this.height);
            this.ctx.lineTo(r * 110 + 50, this.height);
            this.ctx.fill();
        }
        this.ctx.restore();

        // Tropical Mist Clouds
        this.ctx.fillStyle = 'rgba(167, 243, 208, 0.2)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius * 0.6, cloud.y - cloud.radius * 0.2, cloud.radius * 0.7, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.radius * 0.6, cloud.y - cloud.radius * 0.2, cloud.radius * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Background Jungle Palm Trees & Giant Ferns
        if (this.jungleTrees) {
            this.jungleTrees.forEach(t => {
                this.drawJungleTree(t.x, t.y, t.height, t.type);
            });
        }

        // 2. Draw Obstacles
        this.obstacles.forEach(obs => {
            const topMove = Math.sin(obs.time * obs.freqTop) * obs.ampTop;
            const currentTopHeight = obs.topHeight + topMove;

            const bottomMove = Math.cos(obs.time * obs.freqBottom) * obs.ampBottom;
            const currentBottomY = obs.bottomY + bottomMove;

            if (obs.topType === 'vine_monkey') {
                this.drawVineMonkey(obs, currentTopHeight);
            } else {
                this.drawHangingSpider(obs, currentTopHeight);
            }

            if (obs.bottomType === 'snake') {
                this.drawJungleSnake(obs, currentBottomY);
            } else if (obs.bottomType === 'crocodile') {
                this.drawCrocodile(obs, currentBottomY);
            } else {
                this.drawLindeSMR(obs, currentBottomY);
            }
        });

        // 2b. Draw Fast Mosquitoes 🦟
        if (this.mosquitoes) {
            this.mosquitoes.forEach(m => {
                this.drawMosquito(m);
            });
        }

        // 3. Draw Air Liquide H2 Refueling Stations
        this.h2Stations.forEach(st => {
            this.drawH2Station(st);
        });

        // 4. Draw Jungle Ground
        this.drawGround();

        // 5. Draw Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 6. Draw Player (Air Liquide Tanker Truck & Panda)
        this.drawAirLiquideTruck();
    }

    drawRoundedRect(x, y, w, h, r) {
        let rad = { tl: 0, tr: 0, br: 0, bl: 0 };
        if (typeof r === 'number') {
            rad = { tl: r, tr: r, br: r, bl: r };
        } else if (Array.isArray(r)) {
            rad = { tl: r[0] || 0, tr: r[1] || 0, br: r[2] || 0, bl: r[3] || 0 };
        }

        if (this.ctx.roundRect) {
            try {
                this.ctx.roundRect(x, y, w, h, [rad.tl, rad.tr, rad.br, rad.bl]);
                return;
            } catch (e) {}
        }

        // Cross-browser fallback
        this.ctx.moveTo(x + rad.tl, y);
        this.ctx.lineTo(x + w - rad.tr, y);
        this.ctx.quadraticCurveTo(x + w, y, x + w, y + rad.tr);
        this.ctx.lineTo(x + w, y + h - rad.br);
        this.ctx.quadraticCurveTo(x + w, y + h, x + w - rad.br, y + h);
        this.ctx.lineTo(x + rad.bl, y + h);
        this.ctx.quadraticCurveTo(x, y + h, x, y + h - rad.bl);
        this.ctx.lineTo(x, y + rad.tl);
        this.ctx.quadraticCurveTo(x, y, x + rad.tl, y);
        this.ctx.closePath();
    }

    drawEllipse(x, y, rx, ry, rotation = 0) {
        if (this.ctx.ellipse) {
            try {
                this.ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rotation, 0, Math.PI * 2);
                return;
            } catch (e) {}
        }
        this.ctx.arc(x, y, Math.abs(rx), 0, Math.PI * 2);
    }

    drawJungleTree(x, y, height, type) {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(6, 78, 59, 0.45)';

        // Trunk
        this.ctx.fillRect(x - 4, y - height, 8, height);

        // Palm / Fern Leaves
        const topY = y - height;
        for (let l = 0; l < 5; l++) {
            const angle = (l - 2) * 0.5 - Math.PI / 2;
            this.ctx.beginPath();
            this.drawEllipse(
                x + Math.cos(angle) * 18,
                topY + Math.sin(angle) * 12,
                16, 6, angle
            );
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawVineMonkey(obs, currentTopHeight) {
        this.ctx.save();
        const x = obs.x;
        const width = obs.width;
        const vineX = x + width / 2;

        // Wavy Liana Vine hanging down from top to currentTopHeight
        this.ctx.strokeStyle = '#15803d';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(vineX, 0);

        const segments = 6;
        const segmentHeight = currentTopHeight / segments;
        for (let s = 1; s <= segments; s++) {
            const waveX = vineX + Math.sin(s * 1.2 + obs.time * 0.08) * 8;
            this.ctx.lineTo(waveX, s * segmentHeight);
        }
        this.ctx.stroke();

        // Leaves along the vine
        this.ctx.fillStyle = '#22c55e';
        for (let l = 1; l < segments; l++) {
            const leafY = l * segmentHeight;
            const waveX = vineX + Math.sin(l * 1.2 + obs.time * 0.08) * 8;
            this.ctx.beginPath();
            this.ctx.arc(waveX - 6, leafY, 5, 0, Math.PI * 2);
            this.ctx.arc(waveX + 6, leafY, 5, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Animated Monkey 🐒 hanging at the bottom of the vine
        const monkeyY = currentTopHeight - 12;
        const monkeyX = vineX + Math.sin(segments * 1.2 + obs.time * 0.08) * 8;

        // Tail
        this.ctx.strokeStyle = '#78350f';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(monkeyX - 10, monkeyY - 5, 8, 0, Math.PI);
        this.ctx.stroke();

        // Body
        this.ctx.fillStyle = '#78350f';
        this.ctx.beginPath();
        this.ctx.arc(monkeyX, monkeyY, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Head
        this.ctx.beginPath();
        this.ctx.arc(monkeyX, monkeyY - 10, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Face mask (tan)
        this.ctx.fillStyle = '#fde68a';
        this.ctx.beginPath();
        this.drawEllipse(monkeyX, monkeyY - 9, 7, 6, 0);
        this.ctx.fill();

        // Ears
        this.ctx.fillStyle = '#78350f';
        this.ctx.beginPath();
        this.ctx.arc(monkeyX - 10, monkeyY - 12, 4, 0, Math.PI * 2);
        this.ctx.arc(monkeyX + 10, monkeyY - 12, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // Eyes & Mouth
        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(monkeyX - 3, monkeyY - 11, 1.8, 0, Math.PI * 2);
        this.ctx.arc(monkeyX + 3, monkeyY - 11, 1.8, 0, Math.PI * 2);
        this.ctx.fill();

        // Smile
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(monkeyX, monkeyY - 7, 3, 0.1 * Math.PI, 0.9 * Math.PI);
        this.ctx.stroke();

        // Emoji overlay for crisp cute monkey expression 🐒
        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐒', monkeyX, monkeyY + 4);

        this.ctx.restore();
    }

    drawHangingSpider(obs, currentTopHeight) {
        this.ctx.save();
        const x = obs.x;
        const width = obs.width;
        const centerX = x + width / 2;

        // Spider Silk Thread hanging down from canopy y=0 to currentTopHeight
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, currentTopHeight - 10);
        this.ctx.stroke();

        const spiderY = currentTopHeight - 10;

        // Spider 8 Legs
        this.ctx.strokeStyle = '#3b0764';
        this.ctx.lineWidth = 3;
        for (let leg = 0; leg < 4; leg++) {
            const side = leg < 2 ? -1 : 1;
            const offsetL = (leg % 2) * 6;
            const legWiggle = Math.sin(obs.time * 0.2 + leg) * 5;

            this.ctx.beginPath();
            this.ctx.moveTo(centerX, spiderY + offsetL);
            this.ctx.lineTo(centerX + side * (20 + legWiggle), spiderY - 8 + offsetL);
            this.ctx.lineTo(centerX + side * (24 + legWiggle), spiderY + 10 + offsetL);
            this.ctx.stroke();
        }

        // Body
        this.ctx.fillStyle = '#2e1065';
        this.ctx.beginPath();
        this.ctx.arc(centerX, spiderY + 5, 12, 0, Math.PI * 2);
        this.ctx.fill();

        // Head
        this.ctx.fillStyle = '#3b0764';
        this.ctx.beginPath();
        this.ctx.arc(centerX, spiderY - 3, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Glowing Red Eyes (4 eyes)
        this.ctx.fillStyle = '#f43f5e';
        for (let eye = -1; eye <= 1; eye += 0.66) {
            this.ctx.beginPath();
            this.ctx.arc(centerX + eye * 4, spiderY - 4, 1.6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Emoji accent 🕷️
        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🕷️', centerX, spiderY + 10);

        this.ctx.restore();
    }

    drawJungleSnake(obs, currentBottomY) {
        this.ctx.save();
        const x = obs.x;
        const width = obs.width;
        const groundY = this.height - this.groundHeight;
        const height = groundY - currentBottomY;
        const centerX = x + width / 2;

        const snakeY = currentBottomY;

        // Coiled Body up from ground
        this.ctx.strokeStyle = '#15803d';
        this.ctx.lineWidth = 14;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, groundY);

        const segs = 5;
        for (let s = 1; s <= segs; s++) {
            const sy = groundY - (s / segs) * height;
            const sx = centerX + Math.sin(s * 1.5 + obs.time * 0.1) * 12;
            this.ctx.lineTo(sx, sy);
        }
        this.ctx.stroke();

        // Yellow spots / pattern on snake body
        this.ctx.strokeStyle = '#eab308';
        this.ctx.lineWidth = 4;
        this.ctx.setLineDash([6, 8]);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Cobra Head at snakeY
        const headX = centerX + Math.sin(segs * 1.5 + obs.time * 0.1) * 12;

        // Hood
        this.ctx.fillStyle = '#166534';
        this.ctx.beginPath();
        this.drawEllipse(headX, snakeY + 6, 16, 12, 0);
        this.ctx.fill();

        // Head Triangle
        this.ctx.fillStyle = '#15803d';
        this.ctx.beginPath();
        this.ctx.arc(headX, snakeY, 10, 0, Math.PI * 2);
        this.ctx.fill();

        // Red Eyes
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(headX - 4, snakeY - 2, 2.5, 0, Math.PI * 2);
        this.ctx.arc(headX + 4, snakeY - 2, 2.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Flickering Forked Tongue 👅
        const tongueY = snakeY - 10 - Math.abs(Math.sin(obs.time * 0.2)) * 6;
        this.ctx.strokeStyle = '#dc2626';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(headX, snakeY - 6);
        this.ctx.lineTo(headX, tongueY);
        this.ctx.lineTo(headX - 3, tongueY - 4);
        this.ctx.moveTo(headX, tongueY);
        this.ctx.lineTo(headX + 3, tongueY - 4);
        this.ctx.stroke();

        // Emoji accent 🐍
        this.ctx.font = '24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐍', headX, snakeY + 12);

        this.ctx.restore();
    }

    drawCrocodile(obs, currentBottomY) {
        this.ctx.save();
        const x = obs.x;
        const width = obs.width;
        const groundY = this.height - this.groundHeight;
        const centerX = x + width / 2;
        const crocY = currentBottomY;

        // Scaly Body going down to ground
        this.ctx.fillStyle = '#166534';
        this.ctx.fillRect(centerX - 16, crocY + 12, 32, groundY - (crocY + 12));

        // Back Ridges / Spikes
        this.ctx.fillStyle = '#14532d';
        for (let spikeY = crocY + 16; spikeY < groundY - 10; spikeY += 12) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 16, spikeY);
            this.ctx.lineTo(centerX - 22, spikeY + 6);
            this.ctx.lineTo(centerX - 16, spikeY + 12);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.moveTo(centerX + 16, spikeY);
            this.ctx.lineTo(centerX + 22, spikeY + 6);
            this.ctx.lineTo(centerX + 16, spikeY + 12);
            this.ctx.fill();
        }

        // Snapping Mouth
        const mouthAngle = Math.abs(Math.sin(obs.time * 0.12)) * 10;

        // Head / Jaws
        this.ctx.fillStyle = '#15803d';
        this.ctx.beginPath();
        this.drawEllipse(centerX, crocY - mouthAngle / 2, 20, 10, 0);
        this.ctx.fill();

        // Sharp Teeth
        this.ctx.fillStyle = '#ffffff';
        for (let t = -10; t <= 10; t += 5) {
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + t, crocY - mouthAngle / 2 + 4);
            this.ctx.lineTo(centerX + t + 2.5, crocY - mouthAngle / 2 + 9);
            this.ctx.lineTo(centerX + t + 5, crocY - mouthAngle / 2 + 4);
            this.ctx.fill();
        }

        // Yellow Eyes
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 6, crocY - mouthAngle / 2 - 6, 3.5, 0, Math.PI * 2);
        this.ctx.arc(centerX + 6, crocY - mouthAngle / 2 - 6, 3.5, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#000000';
        this.ctx.beginPath();
        this.ctx.arc(centerX - 6, crocY - mouthAngle / 2 - 6, 1.8, 0, Math.PI * 2);
        this.ctx.arc(centerX + 6, crocY - mouthAngle / 2 - 6, 1.8, 0, Math.PI * 2);
        this.ctx.fill();

        // Emoji accent 🐊
        this.ctx.font = '26px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐊', centerX, crocY + 14);

        this.ctx.restore();
    }

    drawMosquito(m) {
        this.ctx.save();
        const currentY = m.y + Math.sin(m.time * m.freq) * m.amp;

        // Buzzing Wing Flap
        const wingFlap = Math.sin(m.time * 0.8) * 6;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.drawEllipse(m.x - 2, currentY - 6, 8, Math.abs(4 + wingFlap), -0.3);
        this.drawEllipse(m.x + 6, currentY - 6, 8, Math.abs(4 - wingFlap), 0.3);
        this.ctx.stroke();

        // Speed / Sting trail behind mosquito
        this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(m.x + 8, currentY);
        this.ctx.lineTo(m.x + 22, currentY);
        this.ctx.stroke();

        // Mosquito Emoji 🦟
        this.ctx.font = '22px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🦟', m.x, currentY);

        this.ctx.restore();
    }

    drawLindeSMR(obs, currentBottomY) {
        this.ctx.save();
        const x = obs.x;
        const width = obs.width;
        const groundY = this.height - this.groundHeight;
        const height = groundY - currentBottomY;

        // Main Reactor Column (Dark Metallic Steel)
        const colGrad = this.ctx.createLinearGradient(x, 0, x + width, 0);
        colGrad.addColorStop(0, '#1e293b');
        colGrad.addColorStop(0.5, '#64748b');
        colGrad.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = colGrad;
        this.ctx.fillRect(x, currentBottomY, width, height);

        // Top Linde Blue Cap
        this.ctx.fillStyle = '#004077';
        this.ctx.fillRect(x - 2, currentBottomY, width + 4, 10);

        // Reformer Furnace Glow at bottom
        const glowY = currentBottomY + height - 24;
        this.ctx.fillStyle = '#f97316';
        this.ctx.fillRect(x + 4, glowY, width - 8, 12);
        this.ctx.fillStyle = '#facc15';
        this.ctx.fillRect(x + 8, glowY + 2, width - 16, 8);

        // Heat Exchanger Piping
        this.ctx.strokeStyle = '#00a3e0';
        this.ctx.lineWidth = 2;
        for (let py = currentBottomY + 16; py < glowY - 4; py += 14) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 4, py);
            this.ctx.lineTo(x + width - 4, py);
            this.ctx.stroke();
        }

        // Linde Logo Badge
        this.ctx.fillStyle = '#004077';
        this.ctx.fillRect(x + 2, currentBottomY + 14, width - 4, 16);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 8px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('LINDE SMR', x + width / 2, currentBottomY + 25);

        // Impact indicator if hit
        if (obs.hitSMR) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.font = 'bold 10px sans-serif';
            this.ctx.fillText('💥 -50% H₂', x + width / 2, currentBottomY - 6);
        }

        this.ctx.restore();
    }

    drawH2Station(st) {
        if (!st || st.collected) return;
        this.ctx.save();

        const x = st.x;
        const y = st.y;

        // Glowing Blue/Cyan Frame
        this.ctx.shadowColor = '#00d2ff';
        this.ctx.shadowBlur = 10;

        this.ctx.strokeStyle = '#00a3e0';
        this.ctx.lineWidth = 2.5;
        this.ctx.strokeRect(x, y, st.width, st.height);

        this.ctx.fillStyle = 'rgba(0, 163, 224, 0.25)';
        this.ctx.fillRect(x, y, st.width, st.height);

        // Header Banner
        this.ctx.fillStyle = '#004077';
        this.ctx.fillRect(x - 3, y - 8, st.width + 6, 12);

        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 7.5px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('STATION H2', x + st.width / 2, y + 1);

        // Green Fuel Nozzle Icon
        this.ctx.fillStyle = '#10b981';
        this.ctx.font = '15px sans-serif';
        this.ctx.fillText('⛽', x + st.width / 2, y + st.height / 2 + 5);

        this.ctx.restore();
    }

    drawGround() {
        this.ctx.save();
        const gY = this.height - this.groundHeight;

        // Jungle Moss / Lush Grass top
        this.ctx.fillStyle = '#15803d';
        this.ctx.fillRect(0, gY, this.width, 14);

        // Dark Tropical Soil / Mud
        this.ctx.fillStyle = '#1c1917';
        this.ctx.fillRect(0, gY + 14, this.width, this.groundHeight - 14);

        // Jungle Roots & Moss highlights
        this.ctx.strokeStyle = '#16a34a';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([12, 8]);
        this.ctx.lineDashOffset = -this.groundOffset;

        this.ctx.beginPath();
        this.ctx.moveTo(0, gY + 8);
        this.ctx.lineTo(this.width, gY + 8);
        this.ctx.stroke();

        // Exotic flowers / mushrooms along the ground
        this.ctx.setLineDash([]);
        for (let x = 10; x < this.width; x += 40) {
            const flowerX = (x - this.groundOffset * 2 + this.width * 2) % (this.width + 40) - 20;
            this.ctx.fillStyle = x % 80 === 0 ? '#f43f5e' : '#eab308';
            this.ctx.beginPath();
            this.ctx.arc(flowerX, gY + 4, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawAirLiquideTruck() {
        this.ctx.save();

        const t = this.truck;
        if (!t || isNaN(t.x) || isNaN(t.y)) {
            this.ctx.restore();
            return;
        }

        const centerX = t.x + t.width / 2;
        const centerY = t.y + t.height / 2;

        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(t.rotation || 0);

        const x = -t.width / 2;
        const y = -t.height / 2;

        // 1. Hydrogen Tanker Body (Air Liquide Cylinder - White & Blue)
        const tankWidth = 42;
        const tankHeight = 26;
        const tankX = x;
        const tankY = y + 2;

        // Cylinder background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.drawRoundedRect(tankX, tankY, tankWidth, tankHeight, 10);
        this.ctx.fill();

        // Air Liquide Blue Center Stripe
        this.ctx.fillStyle = '#004077';
        this.ctx.fillRect(tankX + 10, tankY, 18, tankHeight);

        // Air Liquide Cyan Accent Line
        this.ctx.fillStyle = '#00a3e0';
        this.ctx.fillRect(tankX + 28, tankY, 4, tankHeight);

        // H2 Symbol on Tank
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 9px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('H₂', tankX + 19, tankY + 16);

        // 2. Driver Cab (Front)
        const cabX = tankX + tankWidth - 2;
        const cabY = tankY + 4;
        const cabWidth = 24;
        const cabHeight = 22;

        this.ctx.fillStyle = '#004077';
        this.ctx.beginPath();
        this.drawRoundedRect(cabX, cabY, cabWidth, cabHeight, [4, 8, 4, 4]);
        this.ctx.fill();

        // Windshield / Window
        this.ctx.fillStyle = '#70c5ce';
        this.ctx.fillRect(cabX + 8, cabY + 3, 13, 10);

        // 3. Driver: Selected Animal Driver Emoji in Window
        const driverX = cabX + 14.5;
        const driverY = cabY + 8;

        this.ctx.font = '10px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(this.selectedEmoji || '🐼', driverX, driverY);

        // 4. Wheels
        const wheelY = tankY + tankHeight - 2;
        this.drawWheel(tankX + 10, wheelY);
        this.drawWheel(tankX + 30, wheelY);
        this.drawWheel(cabX + 14, wheelY);

        this.ctx.restore();
    }

    drawWheel(wx, wy) {
        // Outer Tire
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.arc(wx, wy, 5.5, 0, Math.PI * 2);
        this.ctx.fill();

        // Rim
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.beginPath();
        this.ctx.arc(wx, wy, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
    }

    loop() {
        try {
            this.update();
            this.render();
        } catch (err) {
            console.error("Game loop frame error:", err);
        }
        requestAnimationFrame(() => this.loop());
    }
}

// Initialize game on window load
window.addEventListener('load', () => {
    new FlappyH2Game();
});
