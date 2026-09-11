/**
 * SVG Board renderer. Data-driven, renders classic (2P/3P/4P) and hex (6P) boards.
 * Uses a 15x15 grid with 52-cell track for classic mode.
 */

import React from 'react';
import { PlayerColor, GameMode, COLOR_HEX, COLOR_BASE_HEX } from '../config/constants';
import { GameState, TokenState, LegalMove } from '../core/engine';
import { BoardLayout } from '../core/paths';

interface BoardProps {
  state: GameState;
  legalMoves: LegalMove[];
  onTokenClick: (tokenId: string) => void;
  selectedToken: string | null;
}

const CELL = 40;
const BOARD_PX = 15 * CELL; // 600

// The absolute 52-cell loop (Red's perspective starting at index 0)
const TRACK: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],         // 0-4: left arm top
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // 5-10: up col 6
  [7, 0], [8, 0],                                   // 11-12: top center
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],          // 13-17: down col 8
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // 18-23: right arm top
  [14, 7], [14, 8],                                 // 24-25: right center
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],      // 26-30: left row 8
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // 31-36: down col 8
  [7, 14], [6, 14],                                 // 37-38: bottom center
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],      // 39-43: up col 6
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // 44-49: left row 8
  [0, 7], [0, 6],                                   // 50-51: left center
];

// Start positions on the absolute loop
const START_OFFSETS: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
  purple: 0,
  orange: 0,
};

// Home column coordinates for each color (5 cells going toward center)
const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  purple: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  orange: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
};

// Base center positions
const BASE_CENTERS: Record<PlayerColor, [number, number]> = {
  red: [3, 3],
  green: [12, 3],
  yellow: [12, 12],
  blue: [3, 12],
  purple: [3, 3],
  orange: [12, 3],
};

function getAbsLoopIndex(color: PlayerColor, relativePos: number): number {
  return (START_OFFSETS[color] + relativePos) % 52;
}

function getCellCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * CELL, y: (row + 0.5) * CELL };
}

function getTokenPixelPos(color: PlayerColor, pathPos: number, layout: BoardLayout): { x: number; y: number } {
  if (pathPos < 0) return { x: 0, y: 0 };

  // Center (home)
  if (pathPos === layout.pathSize - 1) {
    return getCellCenter(7, 7);
  }

  // Home column
  if (pathPos >= layout.loopSize) {
    const colIndex = pathPos - layout.loopSize;
    const homeCol = HOME_COLUMNS[color];
    if (homeCol && homeCol[colIndex]) {
      return getCellCenter(homeCol[colIndex][0], homeCol[colIndex][1]);
    }
    return getCellCenter(7, 7);
  }

  // Main loop - convert relative position to absolute
  const absIndex = getAbsLoopIndex(color, pathPos);
  const cell = TRACK[absIndex];
  if (cell) {
    return getCellCenter(cell[0], cell[1]);
  }
  return { x: 0, y: 0 };
}

function getBaseTokenPos(color: PlayerColor, tokenIndex: number): { x: number; y: number } {
  const center = BASE_CENTERS[color];
  const cx = (center[0] + 0.5) * CELL;
  const cy = (center[1] + 0.5) * CELL;
  const offsets = [
    { dx: -CELL * 0.55, dy: -CELL * 0.55 },
    { dx: CELL * 0.55, dy: -CELL * 0.55 },
    { dx: -CELL * 0.55, dy: CELL * 0.55 },
    { dx: CELL * 0.55, dy: CELL * 0.55 },
  ];
  return { x: cx + offsets[tokenIndex].dx, y: cy + offsets[tokenIndex].dy };
}

function getStackOffset(stackIndex: number, stackSize: number): { dx: number; dy: number } {
  if (stackSize <= 1) return { dx: 0, dy: 0 };
  const offsets = [
    { dx: -6, dy: -6 },
    { dx: 6, dy: -6 },
    { dx: -6, dy: 6 },
    { dx: 6, dy: 6 },
  ];
  return offsets[stackIndex % 4];
}

const Board: React.FC<BoardProps> = ({ state, legalMoves, onTokenClick }) => {
  const layout = state.layout;
  const activeColors = state.activeColors;

  // Group tokens by position for stacking
  const posGroups = new Map<string, TokenState[]>();
  for (const player of state.players) {
    for (const token of player.tokens) {
      if (token.finished) continue;
      const key = `${token.color}-${token.pathPosition}`;
      if (!posGroups.has(key)) posGroups.set(key, []);
      posGroups.get(key)!.push(token);
    }
  }

  // Build token render list
  const tokenRenders: { token: TokenState; x: number; y: number; isLegal: boolean }[] = [];
  for (const player of state.players) {
    for (const token of player.tokens) {
      if (token.finished) continue;
      let x: number, y: number;
      if (token.pathPosition === -1) {
        const pos = getBaseTokenPos(token.color, token.index);
        x = pos.x; y = pos.y;
      } else {
        const pos = getTokenPixelPos(token.color, token.pathPosition, layout);
        x = pos.x; y = pos.y;
      }
      // Stack offset
      const key = `${token.color}-${token.pathPosition}`;
      const group = posGroups.get(key) || [token];
      const stackIndex = group.indexOf(token);
      const offset = getStackOffset(stackIndex, group.length);
      x += offset.dx; y += offset.dy;

      const isLegal = legalMoves.some(m => m.tokenId === token.id);
      tokenRenders.push({ token, x, y, isLegal });
    }
  }

  // Safe cells for star rendering
  const safeCellPositions: { x: number; y: number; key: string }[] = [];
  const safeSet = new Set<string>();
  for (const color of activeColors) {
    for (const sc of layout.safeCells(color)) {
      const absIdx = getAbsLoopIndex(color, sc);
      const cell = TRACK[absIdx];
      if (cell) {
        const pos = getCellCenter(cell[0], cell[1]);
        const key = `${cell[0]}-${cell[1]}`;
        if (!safeSet.has(key)) {
          safeSet.add(key);
          safeCellPositions.push({ ...pos, key });
        }
      }
    }
  }

  // Colored start cells
  const startCells: { x: number; y: number; color: PlayerColor }[] = [];
  for (const color of activeColors) {
    const absIdx = START_OFFSETS[color];
    const cell = TRACK[absIdx];
    if (cell) {
      startCells.push({ ...getCellCenter(cell[0], cell[1]), color });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`}
      className="w-full h-full"
      style={{ maxWidth: 'min(95vw, 95vh, 600px)', maxHeight: 'min(95vw, 95vh, 600px)', touchAction: 'manipulation' }}
    >
      {/* Board background */}
      <rect width={BOARD_PX} height={BOARD_PX} rx="16" fill="#F6F4EF" />

      {/* Bases */}
      {activeColors.filter(c => BASE_CENTERS[c] && (c === 'red' || c === 'green' || c === 'yellow' || c === 'blue')).map(color => {
        const basePos: Record<string, { x: number; y: number }> = {
          red: { x: 0, y: 0 },
          green: { x: 9 * CELL, y: 0 },
          yellow: { x: 9 * CELL, y: 9 * CELL },
          blue: { x: 0, y: 9 * CELL },
        };
        const pos = basePos[color];
        if (!pos) return null;
        return (
          <g key={`base-${color}`}>
            <rect
              x={pos.x + 3} y={pos.y + 3}
              width={6 * CELL - 6} height={6 * CELL - 6}
              rx="12" fill={COLOR_BASE_HEX[color]} opacity="0.15"
              stroke={COLOR_HEX[color]} strokeWidth="2.5"
            />
            {/* Base token slots */}
            {[0, 1, 2, 3].map(i => {
              const slotPos = getBaseTokenPos(color, i);
              return (
                <circle key={`slot-${color}-${i}`} cx={slotPos.x} cy={slotPos.y} r={14}
                  fill={COLOR_HEX[color]} opacity="0.15" stroke={COLOR_HEX[color]} strokeWidth="1.5" strokeDasharray="4 2" />
              );
            })}
          </g>
        );
      })}

      {/* Track cells */}
      {TRACK.map(([col, row], i) => {
        const x = col * CELL;
        const y = row * CELL;
        // Check if it's a start cell
        const startColor = activeColors.find(c => START_OFFSETS[c] === i);
        const fill = startColor ? COLOR_HEX[startColor] : '#FFFFFF';
        const opacity = startColor ? 0.8 : 1;
        return (
          <rect key={`track-${i}`} x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2}
            rx="4" fill={fill} opacity={opacity} stroke="#D9D9D9" strokeWidth="1" />
        );
      })}

      {/* Home columns */}
      {activeColors.filter(c => HOME_COLUMNS[c]).map(color => (
        <g key={`homecol-${color}`}>
          {HOME_COLUMNS[color].map(([col, row], i) => (
            <rect key={`hc-${color}-${i}`} x={col * CELL + 1} y={row * CELL + 1}
              width={CELL - 2} height={CELL - 2} rx="4"
              fill={COLOR_HEX[color]} opacity="0.35" stroke={COLOR_HEX[color]} strokeWidth="1" />
          ))}
        </g>
      ))}

      {/* Center - pinwheel */}
      {renderCenter(activeColors)}

      {/* Safe cell stars */}
      {safeCellPositions.map(({ x, y, key }) => (
        <text key={`star-${key}`} x={x} y={y + 5} textAnchor="middle" fontSize="18" fill="#AAA" fontWeight="bold">★</text>
      ))}

      {/* Entry arrows */}
      {activeColors.map(color => {
        const entryIdx = (START_OFFSETS[color] - 1 + 52) % 52;
        const cell = TRACK[entryIdx];
        if (!cell) return null;
        const pos = getCellCenter(cell[0], cell[1]);
        return (
          <text key={`arrow-${color}`} x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize="14" fill={COLOR_HEX[color]}>▶</text>
        );
      })}

      {/* Tokens */}
      {tokenRenders.map(({ token, x, y, isLegal }) => (
        <g key={token.id} transform={`translate(${x}, ${y})`}
          onClick={() => isLegal && onTokenClick(token.id)}
          style={{ cursor: isLegal ? 'pointer' : 'default' }}>
          {/* Glow ring for legal moves */}
          {isLegal && (
            <circle r={18} fill="none" stroke={COLOR_HEX[token.color]} strokeWidth="2.5" opacity="0.5">
              <animate attributeName="r" values="18;22;18" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0.15;0.5" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}
          {/* Pin shadow */}
          <ellipse cx={1} cy={3} rx={10} ry={4} fill="rgba(0,0,0,0.15)" />
          {/* Pin body */}
          <circle r={isLegal ? 13 : 11} fill={COLOR_HEX[token.color]} stroke="white" strokeWidth="2.5" />
          {/* Pin highlight */}
          <circle r={4} fill="white" opacity="0.85" cx={-2} cy={-2} />
          {/* Pin inner dot */}
          <circle r={2.5} fill={COLOR_HEX[token.color]} opacity="0.6" />
        </g>
      ))}
    </svg>
  );
};

function renderCenter(activeColors: PlayerColor[]): React.ReactNode {
  const cx = 7.5 * CELL;
  const cy = 7.5 * CELL;
  const size = CELL * 1.5;

  // Background
  const elements: React.ReactNode[] = [
    <rect key="center-bg" x={cx - size} y={cy - size} width={size * 2} height={size * 2}
      fill="white" stroke="#D9D9D9" strokeWidth="1" rx="4" />
  ];

  if (activeColors.length <= 4) {
    // 4-triangle pinwheel
    const triangles: { color: PlayerColor; path: string }[] = [
      { color: 'red', path: `M ${cx} ${cy} L ${cx - size} ${cy - size} L ${cx + size} ${cy - size} Z` },
      { color: 'green', path: `M ${cx} ${cy} L ${cx + size} ${cy - size} L ${cx + size} ${cy + size} Z` },
      { color: 'yellow', path: `M ${cx} ${cy} L ${cx + size} ${cy + size} L ${cx - size} ${cy + size} Z` },
      { color: 'blue', path: `M ${cx} ${cy} L ${cx - size} ${cy + size} L ${cx - size} ${cy - size} Z` },
    ];
    triangles.filter(t => activeColors.includes(t.color)).forEach(t => {
      elements.push(<path key={`tri-${t.color}`} d={t.path} fill={COLOR_HEX[t.color]} opacity="0.65" />);
    });
  } else {
    // 6-wedge pinwheel
    activeColors.forEach((color, i) => {
      const a1 = (i * 60 - 90) * Math.PI / 180;
      const a2 = ((i + 1) * 60 - 90) * Math.PI / 180;
      const x1 = cx + Math.cos(a1) * size;
      const y1 = cy + Math.sin(a1) * size;
      const x2 = cx + Math.cos(a2) * size;
      const y2 = cy + Math.sin(a2) * size;
      elements.push(
        <path key={`wedge-${color}`}
          d={`M ${cx} ${cy} L ${x1} ${y1} A ${size} ${size} 0 0 1 ${x2} ${y2} Z`}
          fill={COLOR_HEX[color]} opacity="0.6" />
      );
    });
  }

  // Center circle
  elements.push(<circle key="center-dot" cx={cx} cy={cy} r={8} fill="white" stroke="#D9D9D9" strokeWidth="1" />);

  return <g>{elements}</g>;
}

export default Board;
