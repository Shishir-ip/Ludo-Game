/**
 * WebAudio synthesized sound effects. No external audio files needed.
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

export function playRoll(): void {
  if (muted) return;
  for (let i = 0; i < 5; i++) {
    setTimeout(() => playTone(200 + Math.random() * 400, 0.05, 'square', 0.1), i * 80);
  }
}

export function playHop(): void {
  playTone(600, 0.1, 'sine', 0.2);
}

export function playCapture(): void {
  playTone(300, 0.15, 'sawtooth', 0.3);
  setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.2), 100);
}

export function playHome(): void {
  playTone(523, 0.15, 'sine', 0.3);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.3), 150);
  setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 300);
}

export function playWin(): void {
  const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.25), i * 120);
  });
}

export function playSix(): void {
  playTone(880, 0.1, 'triangle', 0.3);
  setTimeout(() => playTone(1100, 0.15, 'triangle', 0.25), 100);
}

export function haptic(pattern: number | number[]): void {
  try {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {}
}
