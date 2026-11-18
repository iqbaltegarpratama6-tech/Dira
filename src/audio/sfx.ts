class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.08, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playPickup() {
    this.tone(440, 0.08, 'triangle', 0.07);
    this.tone(660, 0.1, 'triangle', 0.07, 0.05);
  }

  playDrop() {
    this.tone(320, 0.09, 'sine', 0.06);
  }

  playCrimpClick() {
    this.tone(180, 0.06, 'square', 0.06);
    this.tone(820, 0.08, 'triangle', 0.08, 0.04);
  }

  playLanPin(pin: number) {
    this.tone(520 + pin * 55, 0.07, 'sine', 0.06);
  }

  playLaptopConnected() {
    this.tone(523.25, 0.12, 'triangle', 0.08);
    this.tone(659.25, 0.12, 'triangle', 0.08, 0.08);
    this.tone(783.99, 0.22, 'triangle', 0.09, 0.16);
  }

  playStumble() {
    this.tone(160, 0.14, 'sawtooth', 0.09);
    this.tone(95, 0.2, 'sawtooth', 0.08, 0.08);
  }

  playBlackout() {
    this.tone(220, 0.25, 'sawtooth', 0.08);
    this.tone(110, 0.45, 'sawtooth', 0.07, 0.15);
  }

  playPowerRestore() {
    this.tone(240, 0.12, 'triangle', 0.08);
    this.tone(480, 0.16, 'triangle', 0.09, 0.08);
    this.tone(720, 0.2, 'sine', 0.08, 0.18);
  }

  playOverheatAlarm() {
    this.tone(880, 0.11, 'square', 0.05);
    this.tone(660, 0.11, 'square', 0.05, 0.14);
  }

  playCliCommand() {
    this.tone(980, 0.04, 'square', 0.04);
  }

  playVictory() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      this.tone(freq, 0.22, 'triangle', 0.09, i * 0.1);
    });
  }

  playDefeat() {
    [392, 349.23, 311.13, 261.63].forEach((freq, i) => {
      this.tone(freq, 0.24, 'sawtooth', 0.06, i * 0.13);
    });
  }
}

export const sfx = new SoundEngine();
