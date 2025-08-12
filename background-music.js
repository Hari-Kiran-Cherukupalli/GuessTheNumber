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
        this.gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);

        // Create the complete "Twinkle Twinkle Little Star" melody
        const melody = [
            // First verse: "Twinkle twinkle little star"
            { freq: 261.63, duration: 0.5 }, // C - Twin-
            { freq: 261.63, duration: 0.5 }, // C - kle
            { freq: 392.00, duration: 0.5 }, // G - twin-
            { freq: 392.00, duration: 0.5 }, // G - kle
            { freq: 440.00, duration: 0.5 }, // A - lit-
            { freq: 440.00, duration: 0.5 }, // A - tle
            { freq: 392.00, duration: 1.0 }, // G - star
            
            // Second line: "How I wonder what you are"
            { freq: 349.23, duration: 0.5 }, // F - How
            { freq: 349.23, duration: 0.5 }, // F - I
            { freq: 329.63, duration: 0.5 }, // E - won-
            { freq: 329.63, duration: 0.5 }, // E - der
            { freq: 293.66, duration: 0.5 }, // D - what
            { freq: 293.66, duration: 0.5 }, // D - you
            { freq: 261.63, duration: 1.0 }, // C - are
            
            // Third line: "Up above the world so high"
            { freq: 392.00, duration: 0.5 }, // G - Up
            { freq: 392.00, duration: 0.5 }, // G - a-
            { freq: 349.23, duration: 0.5 }, // F - bove
            { freq: 349.23, duration: 0.5 }, // F - the
            { freq: 329.63, duration: 0.5 }, // E - world
            { freq: 329.63, duration: 0.5 }, // E - so
            { freq: 293.66, duration: 1.0 }, // D - high
            
            // Fourth line: "Like a diamond in the sky"
            { freq: 392.00, duration: 0.5 }, // G - Like
            { freq: 392.00, duration: 0.5 }, // G - a
            { freq: 349.23, duration: 0.5 }, // F - dia-
            { freq: 349.23, duration: 0.5 }, // F - mond
            { freq: 329.63, duration: 0.5 }, // E - in
            { freq: 329.63, duration: 0.5 }, // E - the
            { freq: 293.66, duration: 1.0 }, // D - sky
            
            // Final verse repeat: "Twinkle twinkle little star"
            { freq: 261.63, duration: 0.5 }, // C - Twin-
            { freq: 261.63, duration: 0.5 }, // C - kle
            { freq: 392.00, duration: 0.5 }, // G - twin-
            { freq: 392.00, duration: 0.5 }, // G - kle
            { freq: 440.00, duration: 0.5 }, // A - lit-
            { freq: 440.00, duration: 0.5 }, // A - tle
            { freq: 392.00, duration: 1.0 }, // G - star
            
            // Final line: "How I wonder what you are"
            { freq: 349.23, duration: 0.5 }, // F - How
            { freq: 349.23, duration: 0.5 }, // F - I
            { freq: 329.63, duration: 0.5 }, // E - won-
            { freq: 329.63, duration: 0.5 }, // E - der
            { freq: 293.66, duration: 0.5 }, // D - what
            { freq: 293.66, duration: 0.5 }, // D - you
            { freq: 261.63, duration: 1.5 }, // C - are (longer ending)
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
            noteGain.gain.linearRampToValueAtTime(0.5, startTime + 0.1);
            noteGain.gain.linearRampToValueAtTime(0.4, startTime + note.duration - 0.1);
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
                setTimeout(() => this.start(), 2000); // 2 second pause between complete songs
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