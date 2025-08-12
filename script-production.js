// Production version - Replace BACKEND_URL with your actual backend URL
class GuessTheNumberGame {
    constructor() {
        this.currentScreen = 'welcome';
        this.roomCode = null;
        this.isHost = false;
        this.secretNumber = null;
        this.guessCount = 0;
        this.maxGuesses = 15;
        this.gameHistory = [];
        this.gameActive = false;
        this.pollingInterval = null;
        this.playerName = '';
        this.opponentName = '';
        this.isSinglePlayer = false;
        
        // 🔧 CHANGE THIS TO YOUR BACKEND URL:
        this.apiUrl = 'https://web-production-77c0a.up.railway.app/api';
        // Examples:
        // this.apiUrl = 'https://guess-number-backend.railway.app/api';
        // this.apiUrl = 'https://your-app.herokuapp.com/api';
        
        this.musicEnabled = true;
        this.backgroundMusic = null;
        this.musicStarted = false;
        this.userHasInteracted = false;
        
        this.initializeEventListeners();
        this.initializeSounds();
        
        // Initialize background music with error handling
        try {
            this.initializeBackgroundMusic();
        } catch (error) {
            console.log('Background music initialization failed:', error);
            // Create a dummy background music object if initialization fails
            this.backgroundMusic = {
                start: () => console.log('Background music not available'),
                stop: () => {},
                toggle: () => { this.musicEnabled = !this.musicEnabled; return this.musicEnabled; },
                setEnabled: () => {}
            };
        }
        
        // Try to start music immediately (with fallback for browsers that block autoplay)
        this.tryAutoplayMusic();
    }

    tryAutoplayMusic() {
        // Show a friendly welcome prompt that encourages music interaction
        this.showMusicWelcomePrompt();
        
        // Try to start music immediately (will likely fail due to autoplay policy)
        setTimeout(async () => {
            if (this.musicEnabled && this.backgroundMusic) {
                try {
                    console.log('Attempting to start background music automatically...');
                    await this.backgroundMusic.start();
                    this.musicStarted = true;
                    this.userHasInteracted = true;
                    console.log('Background music started successfully!');
                    this.hideMusicPrompt();
                } catch (error) {
                    console.log('Autoplay blocked by browser (this is normal)');
                    // Keep the welcome prompt visible for user interaction
                }
            }
        }, 500);
    }

    showMusicWelcomePrompt() {
        // Create a beautiful welcome overlay
        const overlay = document.createElement('div');
        overlay.id = 'music-welcome-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.5s ease-out;
        `;

        const prompt = document.createElement('div');
        prompt.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 400px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            transform: scale(0.9);
            animation: bounceIn 0.6s ease-out forwards;
        `;
        
        prompt.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 20px;">🎵</div>
            <h2 style="margin: 0 0 15px 0; font-size: 28px;">Welcome to Guess The Number!</h2>
            <p style="margin: 0 0 25px 0; font-size: 16px; opacity: 0.9;">
                Enjoy <strong>"Twinkle Twinkle Little Star"</strong> while you play this exciting number guessing game!
            </p>
            <button id="start-with-music-btn" style="
                background: rgba(255,255,255,0.2);
                border: 2px solid white;
                color: white;
                padding: 15px 30px;
                border-radius: 30px;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                margin: 10px;
                transition: all 0.3s ease;
            ">
                🎵 Start with Music
            </button>
            <br>
            <button id="start-without-music-btn" style="
                background: transparent;
                border: 1px solid rgba(255,255,255,0.5);
                color: rgba(255,255,255,0.8);
                padding: 10px 20px;
                border-radius: 20px;
                cursor: pointer;
                font-size: 14px;
                margin: 10px;
                transition: all 0.3s ease;
            ">
                Continue without music
            </button>
        `;
        
        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes bounceIn {
                0% { transform: scale(0.3); opacity: 0; }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
            }
            #start-with-music-btn:hover {
                background: rgba(255,255,255,0.3) !important;
                transform: scale(1.05);
            }
            #start-without-music-btn:hover {
                background: rgba(255,255,255,0.1) !important;
                border-color: rgba(255,255,255,0.8) !important;
                color: white !important;
            }
        `;
        document.head.appendChild(style);
        
        overlay.appendChild(prompt);
        document.body.appendChild(overlay);

        // Handle music enable button
        document.getElementById('start-with-music-btn').addEventListener('click', async () => {
            await this.startMusicAndHidePrompt();
        });

        // Handle no music button
        document.getElementById('start-without-music-btn').addEventListener('click', () => {
            this.musicEnabled = false;
            this.hideMusicPrompt();
        });
    }

    async startMusicAndHidePrompt() {
        try {
            if (this.musicEnabled && this.backgroundMusic && !this.musicStarted) {
                await this.backgroundMusic.start();
                this.musicStarted = true;
                this.userHasInteracted = true;
                console.log('Background music started after user interaction');
            }
        } catch (error) {
            console.log('Could not start music:', error);
        }
        
        this.hideMusicPrompt();
    }

    hideMusicPrompt() {
        const overlay = document.getElementById('music-welcome-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    // Copy all methods from script.js starting from initializeSounds()
    initializeSounds() {
        // Create audio context for sound effects
        this.audioContext = null;
        this.sounds = {
            click: this.createSound(800, 0.1, 'sine'),
            correct: this.createSound(523, 0.3, 'sine'), // C note
            win: this.createWinSound(),
            lose: this.createLoseSound(),
            error: this.createSound(200, 0.2, 'sawtooth')
        };
    }

    createSound(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    createWinSound() {
        return () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Play a celebratory melody
            const notes = [523, 659, 784, 1047]; // C, E, G, C
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.value = freq;
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, index * 200);
            });
        };
    }

    createLoseSound() {
        return () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Play a descending sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 1);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 1);
        };
    }

    playSound(soundName) {
        try {
            if (this.sounds[soundName]) {
                this.sounds[soundName]();
            }
        } catch (error) {
            console.log('Sound playback not available:', error);
        }
    }

    initializeBackgroundMusic() {
        // Use the dedicated background music manager
        if (typeof BackgroundMusicManager !== 'undefined') {
            this.backgroundMusic = new BackgroundMusicManager();
        } else {
            console.warn('BackgroundMusicManager not found, creating fallback');
            this.backgroundMusic = {
                start: () => console.log('Background music not available'),
                stop: () => {},
                toggle: () => { this.musicEnabled = !this.musicEnabled; return this.musicEnabled; },
                setEnabled: () => {}
            };
        }
    }

    toggleBackgroundMusic() {
        const musicButton = document.getElementById('music-control');
        this.musicEnabled = this.backgroundMusic.toggle();
        
        if (this.musicEnabled) {
            musicButton.textContent = '🎵';
            musicButton.classList.remove('muted');
            musicButton.title = 'Turn off background music';
            
            // Start music ONLY if on menu/setup screens (NOT during gameplay)
            if (this.currentScreen === 'welcome-screen' || 
                this.currentScreen === 'create-room-screen' || 
                this.currentScreen === 'join-room-screen' ||
                this.currentScreen === 'single-player-screen') {
                this.musicStarted = true;
                setTimeout(async () => {
                    try {
                        await this.backgroundMusic.start();
                    } catch (error) {
                        console.log('Could not start music on toggle:', error);
                    }
                }, 200);
            }
        } else {
            musicButton.textContent = '🔇';
            musicButton.classList.add('muted');
            musicButton.title = 'Turn on background music';
        }
    }

    initializeEventListeners() {
        // Music control
        document.getElementById('music-control').addEventListener('click', () => {
            this.playSound('click');
            this.toggleBackgroundMusic();
        });
        // Welcome screen
        document.getElementById('player-name').addEventListener('input', (e) => this.validatePlayerName(e.target.value));
        document.getElementById('single-player-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showSinglePlayer();
        });
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showCreateRoom();
        });
        document.getElementById('join-room-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showJoinRoom();
        });

        // Single player screen
        document.getElementById('back-from-single-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showWelcome();
        });
        document.getElementById('start-single-player-btn').addEventListener('click', () => {
            this.playSound('click');
            this.startSinglePlayerGame();
        });

        // Create room screen
        document.getElementById('back-from-create-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showWelcome();
        });
        document.getElementById('secret-number').addEventListener('input', (e) => this.validateSecretNumber(e.target.value));
        document.getElementById('start-game-btn').addEventListener('click', () => {
            this.playSound('click');
            this.startGame();
        });
        document.getElementById('copy-code-btn').addEventListener('click', () => {
            this.playSound('click');
            this.copyRoomCode();
        });

        // Join room screen
        document.getElementById('back-from-join-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showWelcome();
        });
        document.getElementById('join-game-btn').addEventListener('click', () => {
            this.playSound('click');
            this.joinGame();
        });
        document.getElementById('room-code-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.validateRoomCode(e.target.value);
        });

        // Game screen
        document.getElementById('submit-guess-btn').addEventListener('click', () => {
            this.playSound('click');
            this.submitGuess();
        });
        document.getElementById('guess-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.playSound('click');
                this.submitGuess();
            }
        });
        document.getElementById('guess-input').addEventListener('input', (e) => this.validateGuessInput(e.target.value));
        document.getElementById('leave-game-btn').addEventListener('click', () => {
            this.playSound('click');
            this.leaveGame();
        });
        document.getElementById('new-game-btn').addEventListener('click', () => {
            this.playSound('click');
            this.showWelcome();
        });
    }

    generateRoomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return code;
    }

    validatePlayerName(name) {
        const errorElement = document.getElementById('name-error');
        const buttons = ['single-player-btn', 'create-room-btn', 'join-room-btn'];
        
        console.log('Validating player name:', name);
        
        if (name.trim().length === 0) {
            errorElement.textContent = 'Please enter your name';
            buttons.forEach(id => document.getElementById(id).disabled = true);
            console.log('Player name validation failed: empty name');
            return false;
        }
        
        if (name.length > 10) {
            errorElement.textContent = 'Name must be 10 characters or less';
            buttons.forEach(id => document.getElementById(id).disabled = true);
            console.log('Player name validation failed: too long');
            return false;
        }
        
        errorElement.textContent = '';
        buttons.forEach(id => document.getElementById(id).disabled = false);
        this.playerName = name.trim();
        console.log('Player name validation passed:', this.playerName);
        return true;
    }

    validateSecretNumber(number) {
        const errorElement = document.getElementById('number-error');
        const startButton = document.getElementById('start-game-btn');
        
        if (number.length !== 4) {
            errorElement.textContent = 'Number must be exactly 4 digits';
            startButton.disabled = true;
            return false;
        }

        if (!/^\d{4}$/.test(number)) {
            errorElement.textContent = 'Number must contain only digits';
            startButton.disabled = true;
            return false;
        }

        const digits = number.split('');
        const uniqueDigits = new Set(digits);
        if (uniqueDigits.size !== 4) {
            errorElement.textContent = 'All digits must be different';
            startButton.disabled = true;
            return false;
        }

        errorElement.textContent = '';
        startButton.disabled = false;
        return true;
    }

    validateRoomCode(code) {
        const errorElement = document.getElementById('join-error');
        if (code.length === 4 && /^[A-Z]{4}$/.test(code.toUpperCase())) {
            errorElement.textContent = '';
            return true;
        }
        return false;
    }

    validateGuessInput(guess) {
        const input = document.getElementById('guess-input');
        input.value = guess.replace(/\D/g, '');
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
        this.currentScreen = screenId;
        
        // Handle background music based on screen
        if (this.musicEnabled && this.backgroundMusic) {
            if (screenId === 'welcome-screen' || 
                screenId === 'create-room-screen' || 
                screenId === 'join-room-screen' ||
                screenId === 'single-player-screen') {
                // Start background music for menu screens
                if (!this.musicStarted) {
                    this.musicStarted = true;
                    setTimeout(async () => {
                        if (this.musicEnabled) {
                            try {
                                await this.backgroundMusic.start();
                            } catch (error) {
                                console.log('Could not start music on screen change:', error);
                            }
                        }
                    }, 300);
                }
            } else if (screenId === 'game-screen') {
                // Immediately stop background music when game starts
                this.backgroundMusic.stop();
                this.musicStarted = false;
            }
        }
    }

    showWelcome() {
        this.showScreen('welcome-screen');
        this.clearGameData();
        
        // Start background music on welcome screen if enabled
        if (this.musicEnabled && this.backgroundMusic) {
            this.musicStarted = true;
            setTimeout(async () => {
                if (this.musicEnabled && this.currentScreen === 'welcome-screen') {
                    try {
                        await this.backgroundMusic.start();
                    } catch (error) {
                        console.log('Could not start music on welcome screen:', error);
                    }
                }
            }, 500);
        }
    }

    showSinglePlayer() {
        console.log('showSinglePlayer called, current playerName:', this.playerName);
        const nameInput = document.getElementById('player-name');
        const currentName = nameInput ? nameInput.value : this.playerName;
        console.log('Name from input field:', currentName);
        
        if (!this.validatePlayerName(currentName)) {
            console.log('Player name validation failed in showSinglePlayer');
            return;
        }
        console.log('Showing single player screen');
        this.showScreen('single-player-screen');
        this.isSinglePlayer = true;
    }

    showCreateRoom() {
        const nameInput = document.getElementById('player-name');
        const currentName = nameInput ? nameInput.value : this.playerName;
        
        if (!this.validatePlayerName(currentName)) {
            return;
        }
        document.getElementById('secret-number').value = '';
        document.getElementById('number-error').textContent = '';
        document.getElementById('start-game-btn').disabled = true;
        this.showScreen('create-room-screen');
        this.isHost = true;
        this.isSinglePlayer = false;
    }

    showJoinRoom() {
        const nameInput = document.getElementById('player-name');
        const currentName = nameInput ? nameInput.value : this.playerName;
        
        if (!this.validatePlayerName(currentName)) {
            return;
        }
        document.getElementById('room-code-input').value = '';
        document.getElementById('join-error').textContent = '';
        this.showScreen('join-room-screen');
        this.isHost = false;
        this.isSinglePlayer = false;
    }

    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode).then(() => {
            const button = document.getElementById('copy-code-btn');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        });
    }

    async startSinglePlayerGame() {
        console.log('Starting single player game for:', this.playerName);
        try {
            const response = await fetch(`${this.apiUrl}/create-single-player`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: this.playerName
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                this.playSound('error');
                alert(data.error || 'Error starting single player game');
                return;
            }

            // Store the game ID instead of secret number
            this.roomCode = data.gameId;
            this.gameActive = true;
            this.isHost = false;
            this.isSinglePlayer = true;
            this.opponentName = 'Computer';
            this.gameHistory = [];
            this.guessCount = 0;
            
            // Stop background music before starting game
            if (this.backgroundMusic) {
                this.backgroundMusic.stop();
            }
            
            console.log('Single player game started. Game ID:', this.roomCode);
            this.showGameScreen();
        } catch (error) {
            this.playSound('error');
            console.error('Error starting single player game:', error);
            alert('Error connecting to server. Please try again.');
        }
    }

    async startGame() {
        const secretNumber = document.getElementById('secret-number').value;
        
        if (!this.validateSecretNumber(secretNumber)) {
            this.playSound('error');
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/create-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    playerName: this.playerName,
                    secretNumber: secretNumber
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                this.playSound('error');
                document.getElementById('number-error').textContent = data.error || 'Error creating game';
                return;
            }

            this.roomCode = data.roomCode;
            document.getElementById('room-code').textContent = this.roomCode;
            this.gameHistory = [];
            this.guessCount = 0;
            
            document.getElementById('waiting-message').style.display = 'block';
            this.startPollingForPlayer();
            console.log('Game created with room code:', this.roomCode);
        } catch (error) {
            this.playSound('error');
            console.error('Error creating game:', error);
            document.getElementById('number-error').textContent = 'Error connecting to server. Please try again.';
        }
    }

    async joinGame() {
        const roomCode = document.getElementById('room-code-input').value.toUpperCase();
        
        if (!this.validateRoomCode(roomCode)) {
            this.playSound('error');
            document.getElementById('join-error').textContent = 'Invalid room code format (must be 4 letters)';
            return;
        }

        try {
            const response = await fetch(`${this.apiUrl}/join-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomCode: roomCode,
                    playerName: this.playerName
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                this.playSound('error');
                document.getElementById('join-error').textContent = data.error || 'Error joining game';
                return;
            }

            this.roomCode = roomCode;
            this.opponentName = data.hostName || 'Host';
            this.gameActive = true;
            this.gameHistory = [];
            this.guessCount = 0;
            
            // Update guess history if there are existing guesses
            if (data.guesses && data.guesses.length > 0) {
                this.updateGuessHistory(data.guesses);
                this.guessCount = data.guesses.length;
            }
            
            this.showGameScreen();
        } catch (error) {
            this.playSound('error');
            console.error('Error joining game:', error);
            document.getElementById('join-error').textContent = 'Error connecting to server. Please try again.';
        }
    }

    showGameScreen() {
        // Immediately stop background music when entering game
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        document.getElementById('current-room-code').textContent = this.roomCode;
        document.getElementById('tries-count').textContent = this.maxGuesses;
        
        if (this.isSinglePlayer) {
            document.getElementById('player-role').textContent = `${this.playerName}, you're playing against the Computer. Start guessing!`;
        } else if (this.isHost) {
            document.getElementById('player-role').textContent = `${this.playerName}, you are the host. Waiting for guesses...`;
        } else {
            document.getElementById('player-role').textContent = `${this.playerName}, you are the guesser. Start guessing!`;
        }
        
        // Clear guess history when starting a new game
        this.updateGuessHistory([]);
        this.guessCount = 0;
        
        this.updateGameInterface();
        this.showScreen('game-screen');
        
        if (!this.isSinglePlayer) {
            this.startPollingForUpdates();
        }
    }

    updateGameInterface() {
        const isGuesser = !this.isHost;
        document.getElementById('guess-input').disabled = !isGuesser || !this.gameActive;
        document.getElementById('submit-guess-btn').disabled = !isGuesser || !this.gameActive;
        
        if (this.isHost) {
            document.getElementById('guess-input').style.display = 'none';
            document.getElementById('submit-guess-btn').style.display = 'none';
            document.querySelector('label[for="guess-input"]').style.display = 'none';
        }
    }

    startPollingForPlayer() {
        this.pollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.apiUrl}/game-status/${this.roomCode}`);
                const data = await response.json();

                if (data.success && data.gameActive && data.guesserName) {
                    this.gameActive = true;
                    this.opponentName = data.guesserName;
                    clearInterval(this.pollingInterval);
                    
                    // Stop background music when opponent joins and game starts
                    if (this.backgroundMusic) {
                        this.backgroundMusic.stop();
                    }
                    
                    this.showGameScreen();
                }
            } catch (error) {
                console.error('Error polling for player:', error);
            }
        }, 1000);
    }

    startPollingForUpdates() {
        this.pollingInterval = setInterval(() => {
            this.loadGameState();
        }, 1000);
    }

    async loadGameState() {
        if (!this.roomCode || this.roomCode.startsWith('SINGLE_')) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/game-status/${this.roomCode}`);
            const data = await response.json();

            if (data.success) {
                const previousGuessCount = this.guessCount;
                this.updateGuessHistory(data.guesses || []);
                
                const currentGuessCount = data.totalGuesses || 0;
                this.guessCount = currentGuessCount;
                const triesLeft = this.maxGuesses - currentGuessCount;
                document.getElementById('tries-count').textContent = triesLeft;
                
                // Play sound for both players when a new guess is made
                if (currentGuessCount > previousGuessCount && data.guesses && data.guesses.length > 0) {
                    const lastGuess = data.guesses[data.guesses.length - 1];
                    if (lastGuess.isWin) {
                        this.playSound('win');
                    } else {
                        this.playSound('correct');
                    }
                }
                
                if (data.guesses && data.guesses.length > 0) {
                    const lastGuess = data.guesses[data.guesses.length - 1];
                    if (lastGuess.isWin || data.guesses.length >= this.maxGuesses) {
                        this.endGame(lastGuess.isWin, data.guesses.length);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading game state:', error);
        }
    }

    async submitGuess() {
        const guessInput = document.getElementById('guess-input');
        const guess = guessInput.value;

        if (guess.length !== 4 || !/^\d{4}$/.test(guess)) {
            this.playSound('error');
            alert('Please enter a 4-digit number');
            return;
        }

        const digits = guess.split('');
        const uniqueDigits = new Set(digits);
        if (uniqueDigits.size !== 4) {
            this.playSound('error');
            alert('All digits must be different');
            return;
        }

        if (this.isSinglePlayer) {
            await this.handleSinglePlayerGuess(guess);
        } else {
            await this.handleMultiplayerGuess(guess);
        }
        
        guessInput.value = '';
    }

    async handleSinglePlayerGuess(guess) {
        try {
            const response = await fetch(`${this.apiUrl}/submit-guess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomCode: this.roomCode,
                    guess: guess
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                this.playSound('error');
                alert(data.error || 'Error submitting guess');
                return;
            }

            this.addSinglePlayerGuessToHistory(guess, data.result);
            this.guessCount = data.totalGuesses;
            const triesLeft = this.maxGuesses - this.guessCount;
            document.getElementById('tries-count').textContent = triesLeft;

            if (data.result.isWin) {
                this.playSound('win');
            } else {
                this.playSound('correct');
            }

            if (data.result.isWin || this.guessCount >= this.maxGuesses) {
                if (data.secretNumber) {
                    this.secretNumber = data.secretNumber;
                }
                setTimeout(() => {
                    this.endGame(data.result.isWin, this.guessCount);
                }, 500);
            }
        } catch (error) {
            this.playSound('error');
            console.error('Error submitting single player guess:', error);
            alert('Error connecting to server. Please try again.');
        }
    }

    async handleMultiplayerGuess(guess) {
        try {
            const response = await fetch(`${this.apiUrl}/submit-guess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomCode: this.roomCode,
                    guess: guess
                })
            });

            const data = await response.json();
            
            if (!data.success) {
                this.playSound('error');
                alert(data.error || 'Error submitting guess');
                return;
            }

            this.guessCount = data.totalGuesses;
            const triesLeft = this.maxGuesses - this.guessCount;
            document.getElementById('tries-count').textContent = triesLeft;

            if (data.result.isWin) {
                this.playSound('win');
            } else {
                this.playSound('correct');
            }

            if (data.result.isWin || this.guessCount >= this.maxGuesses) {
                if (data.secretNumber) {
                    this.secretNumber = data.secretNumber;
                }
                setTimeout(() => {
                    this.endGame(data.result.isWin, this.guessCount);
                }, 500);
            }
        } catch (error) {
            this.playSound('error');
            console.error('Error submitting guess:', error);
            alert('Error connecting to server. Please try again.');
        }
    }

    checkGuess(guess, secretNumber) {
        const secretDigits = secretNumber.split('');
        const guessDigits = guess.split('');
        
        let correctNumbers = 0;
        let correctPositions = 0;

        for (let i = 0; i < 4; i++) {
            if (guessDigits[i] === secretDigits[i]) {
                correctPositions++;
            }
        }

        for (let i = 0; i < 4; i++) {
            if (secretDigits.includes(guessDigits[i])) {
                correctNumbers++;
            }
        }

        const isWin = correctPositions === 4;
        
        return {
            correctNumbers,
            correctPositions,
            isWin
        };
    }

    addSinglePlayerGuessToHistory(guess, result) {
        if (!this.gameHistory) this.gameHistory = [];
        
        const newGuess = {
            guess,
            correctNumbers: result.correctNumbers,
            correctPositions: result.correctPositions,
            isWin: result.isWin,
            timestamp: Date.now()
        };
        
        this.gameHistory.push(newGuess);
        this.updateGuessHistory(this.gameHistory);
    }

    updateGuessHistory(guesses) {
        const guessTable = document.getElementById('guess-table');
        guessTable.innerHTML = '';

        // Create 15 cells for the 5x3 grid
        for (let i = 0; i < 15; i++) {
            const guessItem = document.createElement('div');
            guessItem.className = 'guess-item';
            
            if (i < guesses.length) {
                const entry = guesses[i];
                
                // Determine color based on correct numbers and positions
                let colorClass = 'red'; // default for < 4 correct numbers
                if (entry.isWin) {
                    colorClass = 'green';
                } else if (entry.correctNumbers === 4 && entry.correctPositions < 4) {
                    colorClass = 'yellow';
                }
                
                guessItem.classList.add(colorClass);
                guessItem.innerHTML = `
                    <div class="guess-number">${entry.guess}</div>
                    <div class="guess-result">
                        ${entry.correctNumbers}N ${entry.correctPositions}P
                        ${entry.isWin ? '<br/>🎉 WIN!' : ''}
                    </div>
                `;
            } else {
                // Empty slot
                guessItem.innerHTML = `
                    <div class="guess-number">----</div>
                    <div class="guess-result">-- --</div>
                `;
            }
            
            guessTable.appendChild(guessItem);
        }
    }

    endGame(isWin, totalGuesses) {
        this.gameActive = false;
        clearInterval(this.pollingInterval);
        
        // Ensure background music stays stopped during game end
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        const resultTitle = document.getElementById('result-title');
        const resultMessage = document.getElementById('result-message');
        
        if (isWin) {
            this.playSound('win');
            if (this.isSinglePlayer) {
                resultTitle.textContent = '🎉 You Won!';
                resultMessage.textContent = `Congratulations ${this.playerName}! You guessed the computer's number ${this.secretNumber} in ${totalGuesses} tries!`;
            } else if (this.isHost) {
                resultTitle.textContent = `😔 ${this.opponentName} Won!`;
                resultMessage.textContent = `${this.opponentName} successfully guessed your secret number ${this.secretNumber} in ${totalGuesses} tries!`;
            } else {
                resultTitle.textContent = '🎉 You Won!';
                resultMessage.textContent = `Congratulations ${this.playerName}! You guessed ${this.opponentName}'s number ${this.secretNumber} in ${totalGuesses} tries!`;
            }
        } else {
            this.playSound('lose');
            if (this.isSinglePlayer) {
                resultTitle.textContent = '💔 Game Over';
                resultMessage.textContent = `Sorry ${this.playerName}, you failed to guess the computer's number in ${this.maxGuesses} tries. The secret number was ${this.secretNumber}.`;
            } else if (this.isHost) {
                resultTitle.textContent = `🎉 ${this.playerName} Won!`;
                resultMessage.textContent = `${this.opponentName} failed to guess your secret number ${this.secretNumber} in ${this.maxGuesses} tries. You win!`;
            } else {
                resultTitle.textContent = '💔 Game Over';
                resultMessage.textContent = `Sorry ${this.playerName}, you failed to guess ${this.opponentName}'s number in ${this.maxGuesses} tries. The secret number was ${this.secretNumber}.`;
            }
        }
        
        document.getElementById('game-result').style.display = 'block';
        document.getElementById('guess-input').disabled = true;
        document.getElementById('submit-guess-btn').disabled = true;
    }

    async leaveGame() {
        if (this.roomCode && this.roomCode !== 'SINGLE') {
            try {
                await fetch(`${this.apiUrl}/leave-game`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        roomCode: this.roomCode
                    })
                });
            } catch (error) {
                console.error('Error leaving game:', error);
            }
        }
        
        this.clearGameData();
        this.showWelcome();
    }

    clearGameData() {
        clearInterval(this.pollingInterval);
        this.roomCode = null;
        this.isHost = false;
        this.secretNumber = null;
        this.guessCount = 0;
        this.gameHistory = [];
        this.gameActive = false;
        this.isSinglePlayer = false;
        this.opponentName = '';
        
        // Stop background music when clearing game data
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
        }
        
        document.getElementById('game-result').style.display = 'none';
        document.getElementById('waiting-message').style.display = 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GuessTheNumberGame();
}); 