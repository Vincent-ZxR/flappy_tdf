/**
 * Flappy Velo - Chasse au Maillot Jaune
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

        // Windy whoosh accent
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

        // Pickup shimmer noise
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

        // Upbeat race-day melody notes
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

class FlappyTdfGame {
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
        this.bidonToast = document.getElementById('overflow-toast');
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
        this.bestScore = parseInt(localStorage.getItem('al_tdf_best_score') || '0', 10);
        this.rechargeCount = 0;
        this.playerId = this.getOrCreatePlayerId();

        // Load saved pseudo and animal avatar
        this.sessionPseudo = localStorage.getItem('al_tdf_player_pseudo') || '';
        if (this.sessionPseudo && this.playerPseudoInput) {
            this.playerPseudoInput.value = this.sessionPseudo;
        }

        this.selectedTeam = localStorage.getItem('al_tdf_player_team') || 'uae';
        this.selectedJerseyColor = localStorage.getItem('al_tdf_player_jersey') || '#111827';
        this.selectedHelmetColor = localStorage.getItem('al_tdf_player_helmet') || '#00c7b1';
        this.selectedHelmetEmoji = localStorage.getItem('al_tdf_player_helmet_emoji') || '🪖';

        // Set initial animal selection state
        this.selectAnimal(this.selectedTeam, this.selectedHelmetEmoji);

        // Player (Cycliste)
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
            fuelDepletionRate: 0.06 // Drain d'energie regulier
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

    getOrCreatePlayerId() {
        const key = 'al_tdf_player_id';
        const existing = localStorage.getItem(key);
        if (existing) return existing;

        let generated = '';
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            generated = window.crypto.randomUUID().replace(/-/g, '');
        } else {
            generated = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 14)}`;
        }

        localStorage.setItem(key, generated);
        return generated;
    }

    getApiHeaders(includeJsonContentType = false) {
        const headers = {
            'x-player-id': this.playerId
        };

        if (includeJsonContentType) {
            headers['Content-Type'] = 'application/json';
        }

        return headers;
    }

    async fetchUserProfile() {
        try {
            const res = await fetch('/api/me', {
                headers: this.getApiHeaders(false)
            });
            if (res.ok) {
                const data = await res.json();
                this.userEmail = data.email || '';
                if (data.pseudo) {
                    this.sessionPseudo = data.pseudo;
                    if (this.playerPseudoInput) {
                        this.playerPseudoInput.value = data.pseudo;
                    }
                    localStorage.setItem('al_tdf_player_pseudo', data.pseudo);
                } else {
                    this.sessionPseudo = '';
                    if (this.playerPseudoInput) {
                        this.playerPseudoInput.value = '';
                        this.playerPseudoInput.placeholder = 'Entre ton pseudo';
                    }
                }
                if (data.avatar) {
                    const matchedBtn = Array.from(this.animalBtns || []).find(b => b.getAttribute('data-emoji') === data.avatar);
                    const teamName = matchedBtn ? matchedBtn.getAttribute('data-animal') : 'uae';
                    this.selectAnimal(teamName, data.avatar || '🪖');
                }
            }
        } catch (e) {
            console.error('Failed to fetch user profile:', e);
        }
    }

    selectAnimal(team, helmetEmoji) {
        this.selectedTeam = team;
        this.selectedHelmetEmoji = helmetEmoji;

        const button = Array.from(this.animalBtns || []).find(btn => btn.getAttribute('data-animal') === team);
        const jerseyColor = button ? button.getAttribute('data-jersey') : '#111827';
        const helmetColor = button ? button.getAttribute('data-helmet') : '#00c7b1';

        this.selectedJerseyColor = jerseyColor;
        this.selectedHelmetColor = helmetColor;

        localStorage.setItem('al_tdf_player_team', team);
        localStorage.setItem('al_tdf_player_helmet_emoji', helmetEmoji);
        localStorage.setItem('al_tdf_player_jersey', jerseyColor);
        localStorage.setItem('al_tdf_player_helmet', helmetColor);

        if (this.animalBtns) {
            this.animalBtns.forEach(btn => {
                if (btn.getAttribute('data-animal') === team) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }

        if (this.selectedAvatarBadge) {
            this.selectedAvatarBadge.textContent = team.toUpperCase();
        }
    }

    bindEvents() {
        // Animal mosaic buttons selection
        if (this.animalBtns) {
            this.animalBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const team = btn.getAttribute('data-animal');
                    const emoji = btn.getAttribute('data-emoji');
                    this.selectAnimal(team, emoji);
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
            const res = await fetch('/api/scores', {
                headers: this.getApiHeaders(false)
            });
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
                const avatarLabel = String(entry.avatar || 'UAE').toUpperCase();

                li.innerHTML = `
                    <div class="player-name">
                        <span>${medal}</span>
                        <span>${avatarLabel} ${this.escapeHtml(entry.pseudo)}</span>
                    </div>
                    <div class="player-score">${entry.score} km</div>
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
                headers: this.getApiHeaders(true),
                body: JSON.stringify({
                    pseudo: pseudo,
                    avatar: this.selectedTeam,
                    score: score,
                    recharges: recharges
                })
            });
        } catch (e) {
            console.error('Failed to submit score:', e);
        }
    }

    initBackgroundElements() {
        // Cartoon clouds
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                x: Math.random() * this.width,
                y: 20 + Math.random() * 120,
                radius: 25 + Math.random() * 25,
                speed: 0.2 + Math.random() * 0.3
            });
        }

        // Roadside decor (trees and crowd silhouettes)
        this.roadsideDecor = [];
        for (let i = 0; i < 6; i++) {
            this.roadsideDecor.push({
                x: i * 75 + Math.random() * 20,
                y: this.height - this.groundHeight,
                height: 70 + Math.random() * 35,
                type: i % 2 === 0 ? 'tree' : 'crowd'
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
                headers: this.getApiHeaders(true),
                body: JSON.stringify({
                    pseudo: inputVal,
                    avatar: this.selectedTeam
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
        localStorage.setItem('al_tdf_player_pseudo', inputVal);

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
            localStorage.setItem('al_tdf_best_score', this.bestScore.toString());
        }

        // Send score to leaderboard
        this.submitScore(this.score, this.rechargeCount);

        this.deathReason.textContent = reason;
        this.finalScore.textContent = `${this.score} km`;
        this.bestScoreDisplay.textContent = `${this.bestScore} km`;
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

        // Top obstacle: spectator chaos
        const topTypes = ['camera', 'helicopter'];
        const selectedTopType = topTypes[Math.floor(Math.random() * topTypes.length)];

        // Bottom obstacle: road furniture
        const bottomTypes = ['traffic_light', 'stem_cone', 'road_sign'];
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
            passed: false
        });

        // Spawn pickups in the center gap
        if (this.frameCount > 60 && Math.random() < 0.75) {
            const pickupType = Math.random() < 0.65 ? 'gel' : 'bidon';
            this.h2Stations.push({
                baseX: this.width + 110,
                x: this.width + 110,
                baseY: topHeight + gap / 2 - 25,
                y: topHeight + gap / 2 - 25,
                width: 45,
                height: 50,
                type: pickupType,
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

    showBidonToast() {
        if (this.bidonToast) {
            this.bidonToast.classList.remove('hidden');
            setTimeout(() => {
                if (this.bidonToast) this.bidonToast.classList.add('hidden');
            }, 1700);
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

        if (this.roadsideDecor) {
            this.roadsideDecor.forEach(item => {
                item.x -= this.gameSpeed * 0.3;
                if (item.x < -60) {
                    item.x = this.width + 20 + Math.random() * 30;
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

        // 2. Energie
        this.truck.fuel -= this.truck.fuelDepletionRate;
        this.updateFuelBar();

        if (this.truck.fuel <= 0) {
            this.gameOver("🥵 Coup de fringale: energie epuisee !");
            return;
        }

        // Check ground/sky collision
        if (this.truck.y + this.truck.height >= this.height - this.groundHeight) {
            this.gameOver("💥 Chute sur le bas-cote !");
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

            // Score in km + speed curve progression
            if (!obs.passed && obs.x + obs.width < this.truck.x) {
                obs.passed = true;
                this.score++;
                this.scoreDisplay.textContent = this.score.toString();
                this.audio.playScore();

                // +0.15 every 10 km, capped
                this.gameSpeed = Math.min(5.2, this.baseGameSpeed + Math.floor(this.score / 10) * 0.15);
            }

            // Hitbox checks (forgiving padding)
            const padding = 7;
            const truckBox = {
                left: this.truck.x + padding,
                right: this.truck.x + this.truck.width - padding,
                top: this.truck.y + padding,
                bottom: this.truck.y + this.truck.height - padding
            };

            // Top obstacle collision (spectator chaos)
            if (truckBox.right > obs.x && truckBox.left < obs.x + obs.width) {
                if (truckBox.top < currentTopHeight) {
                    let reason = "📷 Collision avec une camera de course !";
                    if (obs.topType === 'helicopter') {
                        reason = "🚁 Collision avec un helicoptere de course !";
                    }
                    this.gameOver(reason);
                    return;
                }

                // Bottom obstacle collision (road furniture)
                if (truckBox.bottom > currentBottomY) {
                    if (obs.bottomType === 'traffic_light') {
                        this.gameOver("🚦 Collision avec un feu rouge !");
                        return;
                    } else if (obs.bottomType === 'stem_cone') {
                        this.gameOver("🟧 Chute sur un plot de signalisation !");
                        return;
                    } else if (obs.bottomType === 'road_sign') {
                        this.gameOver("🪧 Chute apres choc avec un panneau !");
                        return;
                    }
                }
            }

            // Remove off-screen obstacles
            if (obs.x + obs.width < -100) {
                this.obstacles.splice(i, 1);
            }
        }

        // 5. Update pickups (Gel / Bidon)
        for (let i = this.h2Stations.length - 1; i >= 0; i--) {
            const st = this.h2Stations[i];
            st.time += 1;

            // Movement in sine pattern (horizontal and vertical oscillation)
            st.baseX -= this.gameSpeed;
            st.x = st.baseX + Math.sin(st.time * st.freqX) * st.ampX;
            st.y = st.baseY + Math.cos(st.time * st.freqY) * st.ampY;

            // Collision with pickup
            if (!st.collected) {
                const truckCenterX = this.truck.x + this.truck.width / 2;
                const truckCenterY = this.truck.y + this.truck.height / 2;

                if (Math.abs(truckCenterX - (st.x + st.width / 2)) < 36 &&
                    Math.abs(truckCenterY - (st.y + st.height / 2)) < 38) {
                    st.collected = true;

                    const refill = st.type === 'bidon' ? 20 : 10;
                    this.truck.fuel = Math.min(100, this.truck.fuel + refill);
                    this.rechargeCount++;
                    this.audio.playRecharge();
                    if (st.type === 'bidon') {
                        this.showBidonToast();
                    } else {
                        this.showRechargeToast();
                    }

                    // Sparkle particles
                    for (let p = 0; p < 15; p++) {
                        this.particles.push({
                            x: st.x + st.width / 2,
                            y: st.y + st.height / 2,
                            vx: (Math.random() - 0.5) * 6,
                            vy: (Math.random() - 0.5) * 6,
                            radius: Math.random() * 4 + 2,
                            color: st.type === 'bidon' ? '#3b82f6' : '#facc15',
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

        // 1. Cartoon stage sky
        const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGrad.addColorStop(0, '#8fd3ff');
        skyGrad.addColorStop(0.45, '#b8e6ff');
        skyGrad.addColorStop(0.8, '#d9f2ff');
        skyGrad.addColorStop(1, '#f8fbff');
        this.ctx.fillStyle = skyGrad;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Soft mountain layers
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(66, 153, 225, 0.2)';
        for (let r = 0; r < 3; r++) {
            this.ctx.beginPath();
            this.ctx.moveTo(r * 150 - 30, this.height - this.groundHeight - 110);
            this.ctx.lineTo(r * 150 + 60, this.height - this.groundHeight - 200);
            this.ctx.lineTo(r * 150 + 150, this.height - this.groundHeight - 110);
            this.ctx.fill();
        }
        this.ctx.restore();

        // Clouds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.radius * 0.6, cloud.y - cloud.radius * 0.2, cloud.radius * 0.7, 0, Math.PI * 2);
            this.ctx.arc(cloud.x - cloud.radius * 0.6, cloud.y - cloud.radius * 0.2, cloud.radius * 0.7, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Roadside decor
        if (this.roadsideDecor) {
            this.roadsideDecor.forEach(item => {
                this.drawRoadsideDecor(item.x, item.y, item.height, item.type);
            });
        }

        // 2. Draw Obstacles
        this.obstacles.forEach(obs => {
            const topMove = Math.sin(obs.time * obs.freqTop) * obs.ampTop;
            const currentTopHeight = obs.topHeight + topMove;

            const bottomMove = Math.cos(obs.time * obs.freqBottom) * obs.ampBottom;
            const currentBottomY = obs.bottomY + bottomMove;

            if (obs.topType === 'camera') {
                this.drawFanFlag(obs, currentTopHeight);
            } else {
                this.drawSelfieStick(obs, currentTopHeight);
            }

            if (obs.bottomType === 'traffic_light') {
                this.drawRoadBarrier(obs, currentBottomY);
            } else if (obs.bottomType === 'stem_cone') {
                this.drawRoadCone(obs, currentBottomY);
            } else {
                this.drawRoadSign(obs, currentBottomY);
            }
        });

        // 3. Draw pickups
        this.h2Stations.forEach(st => {
            this.drawPickup(st);
        });

        // 4. Draw road
        this.drawGround();

        // 5. Draw Particles
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 6. Draw player (cycliste)
        this.drawCyclist();
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

    drawRoadsideDecor(x, y, height, type) {
        this.ctx.save();
        if (type === 'crowd') {
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillRect(x + 1, y - height + 28, 3, height - 28);
            this.ctx.fillStyle = '#64748b';
            this.ctx.beginPath();
            this.ctx.arc(x + 5, y - height + 22, 7, 0, Math.PI * 2);
            this.ctx.arc(x + 18, y - height + 24, 6, 0, Math.PI * 2);
            this.ctx.arc(x + 29, y - height + 20, 8, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.fillStyle = '#8b5a2b';
            this.ctx.fillRect(x - 3, y - height, 6, height);
            this.ctx.fillStyle = '#2ea44f';
            this.ctx.beginPath();
            this.ctx.arc(x, y - height, 16, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
    }

    drawFanFlag(obs, currentTopHeight) {
        this.ctx.save();
        const centerX = obs.x + obs.width / 2;

        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, 0);
        this.ctx.lineTo(centerX, currentTopHeight - 16);
        this.ctx.stroke();

        const wave = Math.sin(obs.time * 0.18) * 8;
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX, currentTopHeight - 30);
        this.ctx.lineTo(centerX + 26 + wave, currentTopHeight - 24);
        this.ctx.lineTo(centerX, currentTopHeight - 16);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.font = '20px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🎉', centerX, currentTopHeight - 2);
        this.ctx.restore();
    }

    drawSelfieStick(obs, currentTopHeight) {
        this.ctx.save();
        const centerX = obs.x + obs.width / 2;

        if (obs.topType === 'helicopter') {
            const wobble = Math.sin(obs.time * 0.15) * 6;
            this.ctx.fillStyle = '#334155';
            this.ctx.beginPath();
            this.ctx.ellipse(centerX + wobble, currentTopHeight - 18, 18, 8, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#93c5fd';
            this.ctx.beginPath();
            this.ctx.arc(centerX + wobble + 8, currentTopHeight - 18, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.strokeStyle = '#334155';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX + wobble - 6, currentTopHeight - 25);
            this.ctx.lineTo(centerX + wobble + 20, currentTopHeight - 25);
            this.ctx.moveTo(centerX + wobble - 8, currentTopHeight - 16);
            this.ctx.lineTo(centerX + wobble - 22, currentTopHeight - 6);
            this.ctx.stroke();
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(centerX + wobble - 16, currentTopHeight - 4, 2, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            this.ctx.strokeStyle = '#475569';
            this.ctx.lineWidth = 4;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX - 12, 0);
            this.ctx.lineTo(centerX + 10, currentTopHeight - 12);
            this.ctx.stroke();

            this.ctx.fillStyle = '#111827';
            this.ctx.fillRect(centerX + 2, currentTopHeight - 22, 14, 10);
            this.ctx.fillStyle = '#93c5fd';
            this.ctx.fillRect(centerX + 4, currentTopHeight - 20, 10, 6);
            this.ctx.font = '18px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('📷', centerX - 4, currentTopHeight - 3);
        }
        this.ctx.restore();
    }

    drawRoadBarrier(obs, currentBottomY) {
        this.ctx.save();
        const x = obs.x + obs.width / 2;
        const groundY = this.height - this.groundHeight;
        this.ctx.strokeStyle = '#374151';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.moveTo(x, groundY);
        this.ctx.lineTo(x, currentBottomY + 8);
        this.ctx.stroke();

        this.ctx.fillStyle = '#dc2626';
        this.ctx.fillRect(x - 11, currentBottomY + 8, 22, 34);
        this.ctx.fillStyle = '#111827';
        this.ctx.beginPath();
        this.ctx.arc(x, currentBottomY + 16, 4, 0, Math.PI * 2);
        this.ctx.arc(x, currentBottomY + 24, 4, 0, Math.PI * 2);
        this.ctx.arc(x, currentBottomY + 32, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(x, currentBottomY + 8);
        this.ctx.lineTo(x, currentBottomY + 42);
        this.ctx.stroke();
        this.ctx.restore();
    }

    drawRoadCone(obs, currentBottomY) {
        this.ctx.save();
        const centerX = obs.x + obs.width / 2;
        const groundY = this.height - this.groundHeight;
        const wobble = Math.sin(obs.time * 0.18) * 4;
        this.ctx.strokeStyle = '#475569';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + wobble, groundY);
        this.ctx.lineTo(centerX + wobble, currentBottomY + 12);
        this.ctx.stroke();

        this.ctx.fillStyle = '#f97316';
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + wobble, currentBottomY + 12);
        this.ctx.lineTo(centerX - 8 + wobble, currentBottomY + 34);
        this.ctx.lineTo(centerX + 8 + wobble, currentBottomY + 34);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(centerX - 5 + wobble, currentBottomY + 20, 10, 4);
        this.ctx.restore();
    }

    drawRoadSign(obs, currentBottomY) {
        this.ctx.save();
        const centerX = obs.x + obs.width / 2;
        const groundY = this.height - this.groundHeight;
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillRect(centerX - 4, currentBottomY, 8, groundY - currentBottomY);
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.drawRoundedRect(centerX - 24, currentBottomY - 2, 48, 26, 6);
        this.ctx.fill();
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 8px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('DEVIATION', centerX, currentBottomY + 14);
        this.ctx.restore();
    }

    drawPickup(st) {
        if (!st || st.collected) return;
        this.ctx.save();

        const x = st.x;
        const y = st.y;
        const isBidon = st.type === 'bidon';

        // Musette sack
        this.ctx.shadowColor = isBidon ? '#3b82f6' : '#facc15';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.drawRoundedRect(x + 3, y + 10, st.width - 6, st.height - 14, 10);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 12, y + 10);
        this.ctx.lineTo(x + 18, y + 2);
        this.ctx.lineTo(x + 28, y + 2);
        this.ctx.lineTo(x + 34, y + 10);
        this.ctx.stroke();

        this.ctx.fillStyle = isBidon ? 'rgba(37, 99, 235, 0.35)' : 'rgba(250, 204, 21, 0.35)';
        this.ctx.fillRect(x + 8, y + 16, st.width - 16, st.height - 24);

        this.ctx.fillStyle = isBidon ? '#2563eb' : '#facc15';
        this.ctx.fillRect(x + 10, y + 22, st.width - 20, 6);

        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 7px Outfit, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(isBidon ? 'BIDON' : 'GEL', x + st.width / 2, y + 14);

        this.ctx.font = '18px sans-serif';
        this.ctx.fillText(isBidon ? '🧴' : '⚡', x + st.width / 2, y + st.height / 2 + 8);

        this.ctx.restore();
    }

    drawGround() {
        this.ctx.save();
        const gY = this.height - this.groundHeight;

        // Road shoulder
        this.ctx.fillStyle = '#67a857';
        this.ctx.fillRect(0, gY, this.width, 14);

        // Main road
        this.ctx.fillStyle = '#3f3f46';
        this.ctx.fillRect(0, gY + 14, this.width, this.groundHeight - 14);

        // Dashed center line
        this.ctx.strokeStyle = '#f8fafc';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([14, 12]);
        this.ctx.lineDashOffset = -this.groundOffset;

        this.ctx.beginPath();
        this.ctx.moveTo(0, gY + 38);
        this.ctx.lineTo(this.width, gY + 38);
        this.ctx.stroke();

        // Crowd and road highlights
        this.ctx.setLineDash([]);
        for (let x = 10; x < this.width; x += 40) {
            const flowerX = (x - this.groundOffset * 2 + this.width * 2) % (this.width + 40) - 20;
            this.ctx.fillStyle = x % 80 === 0 ? '#f43f5e' : '#facc15';
            this.ctx.beginPath();
            this.ctx.arc(flowerX, gY + 4, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawCyclist() {
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

        const jersey = this.selectedJerseyColor || '#111827';
        const helmet = this.selectedHelmetColor || '#00c7b1';

        // Wheels
        this.drawWheel(x + 13, y + 27, 10);
        this.drawWheel(x + 47, y + 27, 10);

        // Bike frame inspired by pro road bikes
        this.ctx.strokeStyle = '#f8fafc';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 13, y + 27);
        this.ctx.lineTo(x + 28, y + 18);
        this.ctx.lineTo(x + 47, y + 27);
        this.ctx.lineTo(x + 31, y + 27);
        this.ctx.lineTo(x + 28, y + 18);
        this.ctx.lineTo(x + 19, y + 14);
        this.ctx.stroke();

        this.ctx.strokeStyle = '#1f2937';
        this.ctx.lineWidth = 2.2;
        this.ctx.beginPath();
        this.ctx.moveTo(x + 47, y + 27);
        this.ctx.lineTo(x + 53, y + 19);
        this.ctx.lineTo(x + 57, y + 19);
        this.ctx.moveTo(x + 28, y + 18);
        this.ctx.lineTo(x + 21, y + 12);
        this.ctx.stroke();

        // Crank / pedals
        this.ctx.strokeStyle = '#111827';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x + 28, y + 21, 4, 0, Math.PI * 2);
        this.ctx.moveTo(x + 28, y + 21);
        this.ctx.lineTo(x + 35, y + 27);
        this.ctx.moveTo(x + 28, y + 21);
        this.ctx.lineTo(x + 21, y + 27);
        this.ctx.stroke();

        // Rider body
        this.ctx.fillStyle = jersey;
        this.ctx.beginPath();
        this.ctx.roundRect ? this.ctx.roundRect(x + 18, y + 5, 22, 16, 7) : this.drawRoundedRect(x + 18, y + 5, 22, 16, 7);
        this.ctx.fill();
        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.fillRect(x + 23, y + 12, 12, 6);

        // Bent rider pose
        this.ctx.strokeStyle = '#f1c7ab';
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(x + 31, y + 17);
        this.ctx.lineTo(x + 38, y + 20);
        this.ctx.lineTo(x + 46, y + 18);
        this.ctx.stroke();

        // Head / helmet
        this.ctx.fillStyle = '#f1c7ab';
        this.ctx.beginPath();
        this.ctx.arc(x + 43, y + 9, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = helmet;
        this.ctx.beginPath();
        this.ctx.arc(x + 42, y + 7, 6, Math.PI, 0);
        this.ctx.fill();
        this.ctx.fillStyle = '#111827';
        this.ctx.beginPath();
        this.ctx.arc(x + 46, y + 10, 1.2, 0, Math.PI * 2);
        this.ctx.fill();

        // Team stripe accent on jersey
        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillRect(x + 19, y + 10, 20, 2);
        this.ctx.fillStyle = helmet;
        this.ctx.fillRect(x + 19, y + 13, 20, 2);

        this.ctx.restore();
    }

    drawWheel(wx, wy, radius = 5.5) {
        // Outer Tire
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.arc(wx, wy, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Rim
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.beginPath();
        this.ctx.arc(wx, wy, Math.max(2, radius * 0.45), 0, Math.PI * 2);
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
    new FlappyTdfGame();
});
