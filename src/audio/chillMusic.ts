export type ChillVibeId = 'lofi' | 'ambient' | 'bossa';

export interface ChillVibeMeta {
  id: ChillVibeId;
  label: string;
  shortLabel: string;
  subtitle: string;
  bpm: number;
}

export const CHILL_VIBES: ChillVibeMeta[] = [
  {
    id: 'lofi',
    label: 'Lo-Fi Night Shift',
    shortLabel: 'Lo-Fi',
    subtitle: 'Rhodes hangat · Hujan lembut',
    bpm: 72,
  },
  {
    id: 'ambient',
    label: 'Server Lounge',
    shortLabel: 'Lounge',
    subtitle: 'Synth pad tenang · Chime halus',
    bpm: 58,
  },
  {
    id: 'bossa',
    label: 'Cozy Cafe Coding',
    shortLabel: 'Cozy Cafe',
    subtitle: 'Akord jazz santai · Ritme ringan',
    bpm: 80,
  },
];

export interface ChillMusicState {
  isPlaying: boolean;
  vibe: ChillVibeId;
  volume: number;
  muted: boolean;
  unlocked: boolean;
}

type Listener = (state: ChillMusicState) => void;

const N: Record<string, number> = {
  C2: 65.41,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98.0,
  A2: 110.0,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
  A5: 880.0,
  B5: 987.77,
  C6: 1046.5,
  D6: 1174.66,
};

interface ChordVoicing {
  bass: string;
  notes: string[];
  melody: string[];
}

const LOFI_PROGRESSION: ChordVoicing[] = [
  { bass: 'C2', notes: ['C4', 'E4', 'G4', 'B4', 'D5'], melody: ['E5', 'G5', 'B5', 'D6'] },
  { bass: 'A2', notes: ['A3', 'E4', 'G4', 'B4', 'C5'], melody: ['E5', 'G5', 'A5', 'C6'] },
  { bass: 'F2', notes: ['F3', 'C4', 'E4', 'G4', 'A4'], melody: ['C5', 'E5', 'G5', 'A5'] },
  { bass: 'G2', notes: ['G3', 'B3', 'D4', 'F4', 'A4'], melody: ['D5', 'F5', 'G5', 'B5'] },
];

const AMBIENT_PROGRESSION: ChordVoicing[] = [
  { bass: 'F2', notes: ['F3', 'C4', 'E4', 'A4', 'C5'], melody: ['A5', 'C6', 'E5'] },
  { bass: 'G2', notes: ['G3', 'D4', 'E4', 'B4', 'D5'], melody: ['B5', 'D6', 'G5'] },
  { bass: 'E2', notes: ['E3', 'B3', 'D4', 'G4', 'B4'], melody: ['G5', 'B5', 'D6'] },
  { bass: 'A2', notes: ['A3', 'E4', 'G4', 'B4', 'E5'], melody: ['E5', 'A5', 'C6'] },
];

const BOSSA_PROGRESSION: ChordVoicing[] = [
  { bass: 'D2', notes: ['D4', 'F4', 'A4', 'C5', 'E5'], melody: ['A5', 'F5', 'E5', 'C5'] },
  { bass: 'G2', notes: ['G3', 'F4', 'A4', 'B4', 'E5'], melody: ['B5', 'A5', 'G5', 'E5'] },
  { bass: 'C2', notes: ['C4', 'E4', 'G4', 'B4', 'D5'], melody: ['G5', 'E5', 'D5', 'B5'] },
  { bass: 'A2', notes: ['A3', 'G4', 'C5', 'E5'], melody: ['E5', 'G5', 'A5', 'C6'] },
];

class ChillMusicEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private toneFilter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;

  private schedulerTimer: number | null = null;
  private stepIndex = 0;
  private gestureArmed = false;

  private state: ChillMusicState = {
    isPlaying: true,
    vibe: 'lofi',
    volume: 0.55,
    muted: false,
    unlocked: false,
  };

  private listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snapshot = { ...this.state };
    this.listeners.forEach((fn) => fn(snapshot));
  }

  getState(): ChillMusicState {
    return { ...this.state };
  }

  armAutoStartOnGesture() {
    if (typeof window === 'undefined') return;

    // Attempt immediate autoplay right on load if browser permits it
    if (this.state.isPlaying && !this.state.muted) {
      this.startAudioGraph();
    }

    if (this.gestureArmed) return;
    this.gestureArmed = true;

    const handleGesture = () => {
      if (this.state.isPlaying && !this.state.muted) {
        this.startAudioGraph();
      }
      if (this.ctx && this.ctx.state === 'running') {
        window.removeEventListener('pointerdown', handleGesture);
        window.removeEventListener('touchstart', handleGesture);
        window.removeEventListener('mousedown', handleGesture);
        window.removeEventListener('keydown', handleGesture);
      }
    };

    window.addEventListener('pointerdown', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });
    window.addEventListener('mousedown', handleGesture, { passive: true });
    window.addEventListener('keydown', handleGesture, { passive: true });
  }

  private ensureGraph(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.ctx.onstatechange = () => {
        if (!this.ctx) return;
        const nowRunning = this.ctx.state === 'running';
        if (nowRunning !== this.state.unlocked) {
          this.state.unlocked = nowRunning;
          if (nowRunning && this.state.isPlaying && !this.state.muted) {
            this.syncMasterVolume();
          }
          this.emit();
        }
      };

      const compressor = this.ctx.createDynamicsCompressor();
      compressor.threshold.value = -16;
      compressor.knee.value = 18;
      compressor.ratio.value = 3;
      compressor.attack.value = 0.02;
      compressor.release.value = 0.25;
      compressor.connect(this.ctx.destination);

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(compressor);

      this.toneFilter = this.ctx.createBiquadFilter();
      this.toneFilter.type = 'lowpass';
      this.toneFilter.frequency.value = 2400;
      this.toneFilter.Q.value = 0.6;
      this.toneFilter.connect(this.masterGain);

      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.36;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.28;
      const delayFilter = this.ctx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1350;

      this.delayNode.connect(delayFilter);
      delayFilter.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      delayFilter.connect(this.toneFilter);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    this.state.unlocked = this.ctx.state === 'running';
    return this.ctx;
  }

  private startAmbientNoise() {
    const ctx = this.ctx;
    if (!ctx || !this.toneFilter || this.noiseSource) return;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 3;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.03 * white) / 1.03;
      data[i] = lastOut * 2.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 380;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.value = this.state.vibe === 'lofi' ? 0.03 : 0.012;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.toneFilter);
    source.start();

    this.noiseSource = source;
    this.noiseGain = gain;
  }

  private stopAmbientNoise() {
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Ignore already stopped
      }
      this.noiseSource = null;
      this.noiseGain = null;
    }
  }

  private syncMasterVolume() {
    if (!this.ctx || !this.masterGain) return;
    const target =
      this.state.isPlaying && !this.state.muted ? Math.max(0.0001, this.state.volume * 0.48) : 0.0001;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(target, now, 0.14);

    if (this.noiseGain) {
      const noiseTarget =
        this.state.isPlaying && !this.state.muted
          ? this.state.vibe === 'lofi'
            ? 0.03
            : 0.012
          : 0.0001;
      this.noiseGain.gain.setTargetAtTime(noiseTarget, now, 0.2);
    }
  }

  private startAudioGraph() {
    const ctx = this.ensureGraph();
    if (!ctx) return;

    this.startAmbientNoise();
    this.syncMasterVolume();

    if (this.schedulerTimer === null) {
      if (ctx.state === 'running') {
        this.triggerStep();
      }
      const beatMs = this.getStepIntervalMs();
      this.schedulerTimer = window.setInterval(() => {
        this.triggerStep();
      }, beatMs);
    }
    this.emit();
  }

  private restartSchedulerIfRunning() {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
      if (this.state.isPlaying && !this.state.muted) {
        const beatMs = this.getStepIntervalMs();
        this.schedulerTimer = window.setInterval(() => {
          this.triggerStep();
        }, beatMs);
      }
    }
  }

  private getStepIntervalMs(): number {
    const vibeMeta = CHILL_VIBES.find((v) => v.id === this.state.vibe) ?? CHILL_VIBES[0];
    return Math.round((60 / vibeMeta.bpm / 2) * 1000);
  }

  private playWarmVoice(
    freq: number,
    durationSec: number,
    peakGain: number,
    wave: OscillatorType = 'sine',
    attackSec = 0.03,
    sendToDelay = true,
    delayOffsetSec = 0
  ) {
    const ctx = this.ctx;
    if (!ctx || !this.toneFilter || !this.delayNode) return;

    const start = ctx.currentTime + delayOffsetSec;
    const osc = ctx.createOscillator();
    const voiceGain = ctx.createGain();

    osc.type = wave;
    osc.frequency.setValueAtTime(freq, start);
    osc.detune.setValueAtTime((Math.random() - 0.5) * 6, start);

    voiceGain.gain.setValueAtTime(0.0001, start);
    voiceGain.gain.linearRampToValueAtTime(peakGain, start + attackSec);
    voiceGain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

    osc.connect(voiceGain);
    voiceGain.connect(this.toneFilter);
    if (sendToDelay) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = 0.28;
      voiceGain.connect(sendGain);
      sendGain.connect(this.delayNode);
    }

    osc.start(start);
    osc.stop(start + durationSec + 0.05);
  }

  private playSoftShaker(gainVal = 0.015) {
    const ctx = this.ctx;
    if (!ctx || !this.toneFilter) return;

    const length = Math.floor(ctx.sampleRate * 0.045);
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2600;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 4800;

    const gain = ctx.createGain();
    gain.gain.value = gainVal;

    src.connect(hp);
    hp.connect(lp);
    lp.connect(gain);
    gain.connect(this.toneFilter);
    src.start();
  }

  private triggerStep() {
    if (!this.state.isPlaying || this.state.muted || !this.ctx || this.ctx.state !== 'running') {
      return;
    }

    const progression =
      this.state.vibe === 'ambient'
        ? AMBIENT_PROGRESSION
        : this.state.vibe === 'bossa'
          ? BOSSA_PROGRESSION
          : LOFI_PROGRESSION;

    const barStep = this.stepIndex % 8;
    const chordIdx = Math.floor(this.stepIndex / 8) % progression.length;
    const chord = progression[chordIdx];

    if (this.state.vibe === 'ambient') {
      if (barStep === 0) {
        const bassFreq = N[chord.bass];
        if (bassFreq) this.playWarmVoice(bassFreq, 3.8, 0.14, 'sine', 0.45, false);

        chord.notes.forEach((noteName, i) => {
          const f = N[noteName];
          if (f) {
            this.playWarmVoice(f, 3.6, 0.055, i % 2 === 0 ? 'sine' : 'triangle', 0.5, true, i * 0.06);
          }
        });
      }
      if (barStep === 3 || barStep === 6) {
        const melNote = chord.melody[(this.stepIndex + barStep) % chord.melody.length];
        const f = N[melNote];
        if (f && Math.random() > 0.25) {
          this.playWarmVoice(f, 1.9, 0.04, 'sine', 0.04, true);
        }
      }
    } else if (this.state.vibe === 'bossa') {
      if (barStep === 0 || barStep === 3 || barStep === 6) {
        const bassFreq = N[chord.bass];
        if (bassFreq && (barStep === 0 || barStep === 3)) {
          this.playWarmVoice(bassFreq, 0.9, 0.16, 'sine', 0.02, false);
        }
        chord.notes.forEach((noteName, i) => {
          const f = N[noteName];
          if (f) {
            this.playWarmVoice(
              f,
              barStep === 0 ? 1.15 : 0.75,
              barStep === 0 ? 0.065 : 0.042,
              'triangle',
              0.015,
              true,
              i * 0.018
            );
          }
        });
      }
      if (barStep % 2 === 1) {
        this.playSoftShaker(0.014);
      }
      if (barStep === 2 || barStep === 5 || barStep === 7) {
        if (Math.random() > 0.35) {
          const melNote = chord.melody[this.stepIndex % chord.melody.length];
          const f = N[melNote];
          if (f) this.playWarmVoice(f, 0.85, 0.048, 'sine', 0.015, true);
        }
      }
    } else {
      if (barStep === 0) {
        const bassFreq = N[chord.bass];
        if (bassFreq) this.playWarmVoice(bassFreq, 2.8, 0.18, 'sine', 0.05, false);

        chord.notes.forEach((noteName, i) => {
          const f = N[noteName];
          if (f) {
            this.playWarmVoice(
              f,
              2.6,
              0.06,
              i === 0 ? 'triangle' : 'sine',
              0.03,
              true,
              i * 0.035
            );
          }
        });
      }
      if (barStep === 4) {
        const softNotes = chord.notes.slice(1, 4);
        softNotes.forEach((noteName, i) => {
          const f = N[noteName];
          if (f) this.playWarmVoice(f, 1.3, 0.03, 'sine', 0.03, true, i * 0.025);
        });
      }
      if (barStep === 2 || barStep === 5 || barStep === 7) {
        if (Math.random() > 0.3) {
          const melNote = chord.melody[(this.stepIndex + chordIdx) % chord.melody.length];
          const f = N[melNote];
          if (f) this.playWarmVoice(f, 1.1, 0.045, 'sine', 0.02, true);
        }
      }
      if (barStep === 2 || barStep === 6) {
        this.playSoftShaker(0.01);
      }
    }

    this.stepIndex += 1;
  }

  play() {
    this.state.isPlaying = true;
    this.startAudioGraph();
    this.emit();
  }

  pause() {
    this.state.isPlaying = false;
    this.syncMasterVolume();
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.stopAmbientNoise();
    this.emit();
  }

  toggle() {
    if (this.state.isPlaying && this.state.unlocked) {
      this.pause();
    } else {
      if (this.state.muted) {
        this.state.muted = false;
      }
      this.play();
    }
  }

  setVibe(vibe: ChillVibeId) {
    this.state.vibe = vibe;
    this.stepIndex = 0;
    if (this.state.isPlaying && !this.state.muted) {
      this.startAudioGraph();
      this.restartSchedulerIfRunning();
    }
    this.emit();
  }

  setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.state.unlocked) {
      this.syncMasterVolume();
    }
    this.emit();
  }

  setMuted(muted: boolean) {
    this.state.muted = muted;
    if (muted) {
      this.syncMasterVolume();
      if (this.schedulerTimer !== null) {
        window.clearInterval(this.schedulerTimer);
        this.schedulerTimer = null;
      }
      this.stopAmbientNoise();
    } else if (this.state.isPlaying) {
      this.startAudioGraph();
    }
    this.emit();
  }
}

export const chillMusic = new ChillMusicEngine();
