// Background Music Module
class BackgroundMusicManager {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.oscillators = [];
        this.gainNode = null;
        this.loopTimeout = null;
        this.enabled = true;
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.log('Web Audio API not supported:', error);
            return false;
        }
        return true;
    }

    createMelody() {
        if (!this.audioContext || this.isPlaying) return;

        this.isPlaying = true;
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);

        // Create a pleasant ambient melody
        const melody = [
            { freq: 261.63, duration: 1.5 }, // C4
            { freq: 329.63, duration: 1.5 }, // E4
            { freq: 392.00, duration: 1.5 }, // G4
            { freq: 523.25, duration: 2.0 }, // C5
            { freq: 392.00, duration: 1.5 }, // G4
            { freq: 329.63, duration: 1.5 }, // E4
            { freq: 261.63, duration: 2.0 }, // C4
        ];

        let startTime = this.audioContext.currentTime;

        melody.forEach((note, index) => {
            const oscillator = this.audioContext.createOscillator();
            const noteGain = this.audioContext.createGain();

            oscillator.connect(noteGain);
            noteGain.connect(this.gainNode);

            oscillator.frequency.setValueAtTime(note.freq, startTime);
            oscillator.type = 'sine';

            // Create smooth fade in/out for each note
            noteGain.gain.setValueAtTime(0, startTime);
            noteGain.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
            noteGain.gain.linearRampToValueAtTime(0.2, startTime + note.duration - 0.1);
            noteGain.gain.linearRampToValueAtTime(0, startTime + note.duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + note.duration);
            
            this.oscillators.push(oscillator);
            startTime += note.duration;
        });

        // Schedule the next loop
        const totalDuration = melody.reduce((sum, note) => sum + note.duration, 0);
        this.loopTimeout = setTimeout(() => {
            if (this.enabled && this.isPlaying) {
                this.stop();
                setTimeout(() => this.start(), 1000); // 1 second pause between loops
            }
        }, (totalDuration + 1) * 1000);
    }

    async start() {
        if (!this.enabled) return;

        if (!this.audioContext) {
            const initialized = await this.init();
            if (!initialized) return;
        }

        // Resume audio context if it's suspended (required by some browsers)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.createMelody();
    }

    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;

        // Clear the loop timeout
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }

        // Stop all oscillators
        this.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Oscillator might already be stopped
            }
        });
        this.oscillators = [];

        // Disconnect gain node
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stop();
        }
        return this.enabled;
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }
}

// Export for use in main script
window.BackgroundMusicManager = BackgroundMusicManager; 