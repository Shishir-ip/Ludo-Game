/**
 * Game constants, color palette, and theme configuration.
 * All colors as named exports for use across the app.
 */

export const COLORS = {
  red: '#E23A3A',
  green: '#2E9E44',
  blue: '#34A8E8',
  yellow: '#F2CE00',
  purple: '#8E44AD',
  orange: '#F39C12',
} as const;

export const YELLOW_BASE = '#B7A418';
export const TRACK = '#FFFFFF';
export const BORDER = '#D9D9D9';
export const BG = '#F6F4EF';
export const DARK = '#2D2D2D';

export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'orange';

export const ALL_COLORS: PlayerColor[] = ['red', 'green', 'yellow', 'blue', 'purple', 'orange'];

export const COLOR_HEX: Record<PlayerColor, string> = {
  red: COLORS.red,
  green: COLORS.green,
  blue: COLORS.blue,
  yellow: COLORS.yellow,
  purple: COLORS.purple,
  orange: COLORS.orange,
};

export const COLOR_BASE_HEX: Record<PlayerColor, string> = {
  red: COLORS.red,
  green: COLORS.green,
  blue: COLORS.blue,
  yellow: YELLOW_BASE,
  purple: COLORS.purple,
  orange: COLORS.orange,
};

export const TOKENS_PER_PLAYER = 4;
export const DICE_ANIM_MS = 600;
export const HOP_MS = 160;

export interface GameSettings {
  soundEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  autoMoveSingle: boolean;
  threeSixesAbort: boolean;
  continueForRanks: boolean;
  passDevice: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  animationSpeed: 'normal',
  autoMoveSingle: false,
  threeSixesAbort: true,
  continueForRanks: false,
  passDevice: false,
};

export type GameMode = 2 | 3 | 4 | 6;

export const MODE_COLORS: Record<GameMode, PlayerColor[]> = {
  2: ['red', 'yellow'],
  3: ['red', 'green', 'yellow'],
  4: ['red', 'green', 'yellow', 'blue'],
  6: ['red', 'green', 'yellow', 'blue', 'purple', 'orange'],
};
