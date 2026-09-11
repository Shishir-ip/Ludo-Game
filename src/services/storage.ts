/**
 * localStorage wrapper for persisting game state, settings, and stats.
 */

import { GameSettings, DEFAULT_SETTINGS } from '../config/constants';
import { GameState } from '../core/engine';

const KEYS = {
  SETTINGS: 'ludo_settings',
  STATS: 'ludo_stats',
  GAME_STATE: 'ludo_game_state',
  PLAYER_NAMES: 'ludo_player_names',
};

export interface WinStats {
  gamesPlayed: number;
  winsByColor: Record<string, number>;
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: GameSettings): void {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function loadStats(): WinStats {
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { gamesPlayed: 0, winsByColor: {} };
}

export function saveStats(stats: WinStats): void {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
}

export function recordWin(color: string): void {
  const stats = loadStats();
  stats.gamesPlayed++;
  stats.winsByColor[color] = (stats.winsByColor[color] || 0) + 1;
  saveStats(stats);
}

export function saveGameState(state: GameState): void {
  try {
    const serializable = {
      ...state,
      layout: undefined, // can't serialize functions
    };
    localStorage.setItem(KEYS.GAME_STATE, JSON.stringify(serializable));
  } catch {}
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(KEYS.GAME_STATE);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function clearGameState(): void {
  localStorage.removeItem(KEYS.GAME_STATE);
}

export function hasSavedGame(): boolean {
  return localStorage.getItem(KEYS.GAME_STATE) !== null;
}

export function loadPlayerNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS.PLAYER_NAMES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function savePlayerNames(names: Record<string, string>): void {
  localStorage.setItem(KEYS.PLAYER_NAMES, JSON.stringify(names));
}

export function resetStats(): void {
  localStorage.removeItem(KEYS.STATS);
}
