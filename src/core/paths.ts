/**
 * Board path definitions for classic (2P/3P/4P) and hexagonal (6P) boards.
 * Each token's path is an array of cell indices.
 */

import { PlayerColor, GameMode } from '../config/constants';

// Classic 15x15 board: 52-cell main loop + 6-cell home column + center
// Per-token path: 58 slots (0-57), where 57 = center/home
const CLASSIC_LOOP_SIZE = 52;
const CLASSIC_COL_SIZE = 5;
const CLASSIC_PATH_SIZE = CLASSIC_LOOP_SIZE + CLASSIC_COL_SIZE + 1; // 58

// Start positions on the main loop for each color (classic)
const CLASSIC_STARTS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
  purple: 0,  // unused in classic
  orange: 0,  // unused in classic
};

// Hex 6P board: 72-cell ring + 5-cell column + center
const HEX_LOOP_SIZE = 72;
const HEX_COL_SIZE = 5;
const HEX_PATH_SIZE = HEX_LOOP_SIZE + HEX_COL_SIZE + 1; // 78

const HEX_STARTS: Record<PlayerColor, number> = {
  red: 0,
  green: 12,
  yellow: 24,
  blue: 36,
  purple: 48,
  orange: 60,
};

export interface BoardLayout {
  mode: GameMode;
  loopSize: number;
  pathSize: number;
  colSize: number;
  starts: Record<PlayerColor, number>;
  safeCells: (color: PlayerColor) => number[];
  entryCell: (color: PlayerColor) => number;
  getTokenPath: (color: PlayerColor, tokenIndex: number) => number[];
  isHomeColumn: (color: PlayerColor, pathIndex: number) => boolean;
  isCenter: (pathIndex: number) => boolean;
}

function buildClassicLayout(mode: GameMode): BoardLayout {
  const activeColors = getActiveColors(mode);

  return {
    mode,
    loopSize: CLASSIC_LOOP_SIZE,
    pathSize: CLASSIC_PATH_SIZE,
    colSize: CLASSIC_COL_SIZE,
    starts: CLASSIC_STARTS,
    safeCells: (color: PlayerColor) => {
      const start = CLASSIC_STARTS[color];
      return [start, (start + 8) % CLASSIC_LOOP_SIZE];
    },
    entryCell: (color: PlayerColor) => {
      return (CLASSIC_STARTS[color] - 1 + CLASSIC_LOOP_SIZE) % CLASSIC_LOOP_SIZE;
    },
    getTokenPath: (color: PlayerColor, _tokenIndex: number) => {
      const start = CLASSIC_STARTS[color];
      const path: number[] = [];
      // Main loop from start position (52 cells wrapping around)
      for (let i = 0; i < CLASSIC_LOOP_SIZE; i++) {
        path.push((start + i) % CLASSIC_LOOP_SIZE);
      }
      // Home column (indices 52-56)
      for (let i = 0; i < CLASSIC_COL_SIZE; i++) {
        path.push(CLASSIC_LOOP_SIZE + i);
      }
      // Center (index 57)
      path.push(CLASSIC_LOOP_SIZE + CLASSIC_COL_SIZE);
      return path;
    },
    isHomeColumn: (color: PlayerColor, pathIndex: number) => {
      return pathIndex >= CLASSIC_LOOP_SIZE && pathIndex < CLASSIC_LOOP_SIZE + CLASSIC_COL_SIZE;
    },
    isCenter: (pathIndex: number) => {
      return pathIndex === CLASSIC_LOOP_SIZE + CLASSIC_COL_SIZE;
    },
  };
}

function buildHexLayout(): BoardLayout {
  return {
    mode: 6,
    loopSize: HEX_LOOP_SIZE,
    pathSize: HEX_PATH_SIZE,
    colSize: HEX_COL_SIZE,
    starts: HEX_STARTS,
    safeCells: (color: PlayerColor) => {
      const start = HEX_STARTS[color];
      return [start, (start + 7) % HEX_LOOP_SIZE];
    },
    entryCell: (color: PlayerColor) => {
      return (HEX_STARTS[color] - 1 + HEX_LOOP_SIZE) % HEX_LOOP_SIZE;
    },
    getTokenPath: (color: PlayerColor, _tokenIndex: number) => {
      const start = HEX_STARTS[color];
      const path: number[] = [];
      for (let i = 0; i < HEX_LOOP_SIZE; i++) {
        path.push((start + i) % HEX_LOOP_SIZE);
      }
      for (let i = 0; i < HEX_COL_SIZE; i++) {
        path.push(HEX_LOOP_SIZE + i);
      }
      path.push(HEX_LOOP_SIZE + HEX_COL_SIZE);
      return path;
    },
    isHomeColumn: (color: PlayerColor, pathIndex: number) => {
      return pathIndex >= HEX_LOOP_SIZE && pathIndex < HEX_LOOP_SIZE + HEX_COL_SIZE;
    },
    isCenter: (pathIndex: number) => {
      return pathIndex === HEX_LOOP_SIZE + HEX_COL_SIZE;
    },
  };
}

function getActiveColors(mode: GameMode): PlayerColor[] {
  switch (mode) {
    case 2: return ['red', 'yellow'];
    case 3: return ['red', 'green', 'yellow'];
    case 4: return ['red', 'green', 'yellow', 'blue'];
    case 6: return ['red', 'green', 'yellow', 'blue', 'purple', 'orange'];
  }
}

export function getBoardLayout(mode: GameMode): BoardLayout {
  if (mode === 6) return buildHexLayout();
  return buildClassicLayout(mode);
}

export { getActiveColors, CLASSIC_LOOP_SIZE, HEX_LOOP_SIZE, CLASSIC_PATH_SIZE, HEX_PATH_SIZE };
