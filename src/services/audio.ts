/**
 * WebAudio synthesized sound effects. No external audio files needed.
 * Each sound is distinct and recognizable.
 */

import { GameSettings } from '../config/constants';

let audioCtx: AudioContext | null = null;
let muted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function initAudio(settings: GameSettings): void {
  muted = !settings.soundEnabled;
}

export function setMuted(m: boolean): void {
  muted = m;
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3): void {
  if (muted) return;
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

/**
 * Named SFX map - each sound is distinct
 */
export const sfx = {
  /** Dice roll - rattle sound */
  roll(): void {
    if (muted) return;
    for (let i = 0; i < 5; i++) {
      setTimeout(() => playTone(200 + Math.random() * 400, 0.05, 'square', 0.1), i * 80);
    }
  },

  /** Rolling a 6 - bright ding */
  six(): void {
    playTone(880, 0.1, 'triangle', 0.3);
    setTimeout(() => playTone(1100, 0.15, 'triangle', 0.25), 100);
  },

  /** Token hop - soft step tick (wood tap) */
  step(stepIndex: number = 0): void {
    if (muted) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Filtered noise burst
      const bufferSize = ctx.sampleRate * 0.05;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + stepIndex * 50, now);
      filter.Q.setValueAtTime(2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.05);

      // Low thump
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150 + stepIndex * 10, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      const oscGain = ctx.createGain();
      oscGain.gain.setValueAtTime(0.2, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch {}
  },

  /** Base exit - pop sound */
  baseExit(): void {
    playTone(400, 0.08, 'sine', 0.25);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.2), 50);
  },

  /** Capture/cut - descending zap + pop */
  capture(): void {
    if (muted) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      // Descending zap
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(800, now);
      osc1.frequency.exponentialRampToValueAtTime(200, now + 0.2);

      const gain1 = ctx.createGain();
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);

      // Pop
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(300, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(100, now + 0.25);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.25);
    } catch {}
  },

  /** Home - chime arpeggio */
  home(): void {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 100);
    });
  },

  /** Turn change - soft whoosh */
  turnChange(): void {
    if (muted) return;
    try {
      const ctx = getCtx();
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 0.15;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.linearRampToValueAtTime(800, now + 0.15);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.08, now);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.15);
    } catch {}
  },

  /** UI click */
  click(): void {
    playTone(1000, 0.03, 'sine', 0.1);
  },

  /** Win - fanfare */
  win(): void {
    const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 120);
    });
  }
};

// Legacy functions for backward compatibility
export function playRoll(): void { sfx.roll(); }
export function playHop(): void { sfx.step(0); }
export function playCapture(): void { sfx.capture(); }
export function playHome(): void { sfx.home(); }
export function playWin(): void { sfx.win(); }
export function playSix(): void { sfx.six(); }

export function haptic(pattern: number | number[]): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}
