/**
 * SVG Board renderer - saturated vibrant colors matching reference image.
 * 3D tokens with radial gradients, specular highlights, and shadows.
 * Rich colored bases with white inner panels.
 * Stack badges for multiple tokens on same cell.
 */

import React, { useMemo } from 'react';
import { PlayerColor, COLOR_HEX } from '../config/constants';
import { GameState, TokenState, LegalMove } from '../core/engine';
import { BoardLayout } from '../core/paths';

interface BoardProps {
  state: GameState;
  legalMoves: LegalMove[];
  onTokenClick: (tokenId: string) => void;
  selectedToken: string | null;
  boardRef?: React.RefObject<HTMLDivElement>;
}

const CELL = 40;
const BOARD_PX = 15 * CELL;

// Absolute 52-cell track
const TRACK: [number, number][] = [
  [1, 6], [2, 6], [3, 6], [4, 6], [5, 6],
  [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0],
  [7, 0], [8, 0],
  [8, 1], [8, 2], [8, 3], [8, 4], [8, 5],
  [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6],
  [14, 7], [14, 8],
  [13, 8], [12, 8], [11, 8], [10, 8], [9, 8],
  [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14],
  [7, 14], [6, 14],
  [6, 13], [6, 12], [6, 11], [6, 10], [6, 9],
  [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  [0, 7], [0, 6],
];

const START_OFFSETS: Record<PlayerColor, number> = {
  red: 0, green: 13, yellow: 26, blue: 39, purple: 0, orange: 0,
};

const HOME_COLUMNS: Record<PlayerColor, [number, number][]> = {
  red: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  green: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  yellow: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
  blue: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  purple: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  orange: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
};

const BASE_CENTERS: Record<PlayerColor, [number, number]> = {
  red: [3, 3], green: [12, 3], yellow: [12, 12], blue: [3, 12],
  purple: [3, 3], orange: [12, 3],
};

// Saturated color palette
const SATURATED: Record<PlayerColor, { main: string; dark: string; light: string }> = {
  red: { main: '#E23A3A', dark: '#B91C1C', light: '#FCA5A5' },
  green: { main: '#16A34A', dark: '#166534', light: '#86EFAC' },
  yellow: { main: '#EAB308', dark: '#A16207', light: '#FDE68A' },
  blue: { main: '#2563EB', dark: '#1E40AF', light: '#93C5FD' },
  purple: { main: '#8B5CF6', dark: '#6D28D9', light: '#C4B5FD' },
  orange: { main: '#F97316', dark: '#C2410C', light: '#FDBA74' },
};

// Stack offsets for multiple tokens on same cell
const STACK_OFFSETS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-0.16, -0.16], [0.16, 0.16]],
  3: [[-0.18, -0.14], [0.18, -0.14], [0, 0.18]],
  4: [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]],
};

function getAbsLoopIndex(color: PlayerColor, relativePos: number): number {
  return (START_OFFSETS[color] + relativePos) % 52;
}

function getCellCenter(col: number, row: number): { x: number; y: number } {
  return { x: (col + 0.5) * CELL, y: (row + 0.5) * CELL };
}

function getTokenPixelPos(color: PlayerColor, pathPos: number, layout: BoardLayout): { x: number; y: number } {
  if (pathPos < 0) return { x: 0, y: 0 };
  if (pathPos === layout.pathSize - 1) return getCellCenter(7, 7);
  if (pathPos >= layout.loopSize) {
    const colIndex = pathPos - layout.loopSize;
    const homeCol = HOME_COLUMNS[color];
    if (homeCol && homeCol[colIndex]) return getCellCenter(homeCol[colIndex][0], homeCol[colIndex][1]);
    return getCellCenter(7, 7);
  }
  const absIndex = getAbsLoopIndex(color, pathPos);
  const cell = TRACK[absIndex];
  if (cell) return getCellCenter(cell[0], cell[1]);
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

// Expose cellCenter for animation system
export function cellCenter(color: PlayerColor, pathPos: number, layout: BoardLayout): { x: number; y: number } {
  return getTokenPixelPos(color, pathPos, layout);
}

const Board: React.FC<BoardProps> = ({ state, legalMoves, onTokenClick }) => {
  const layout = state.layout;
  const activeColors = state.activeColors;

  const tokenRenders = useMemo(() => {
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

    const renders: { token: TokenState; x: number; y: number; isLegal: boolean; stackCount: number; stackIndex: number }[] = [];
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

        const key = `${token.color}-${token.pathPosition}`;
        const group = posGroups.get(key) || [token];
        const stackCount = group.length;
        const stackIndex = group.indexOf(token);

        // Apply stack offsets
        if (stackCount > 1) {
          const offsets = STACK_OFFSETS[Math.min(stackCount, 4)] || STACK_OFFSETS[4];
          const [dx, dy] = offsets[stackIndex] || [0, 0];
          x += dx * CELL;
          y += dy * CELL;
        }

        const isLegal = legalMoves.some(m => m.tokenId === token.id);
        renders.push({ token, x, y, isLegal, stackCount, stackIndex });
      }
    }
    return renders;
  }, [state.players, layout, legalMoves]);

  // Group by position for badge rendering
  const stackBadges = useMemo(() => {
    const badges: { x: number; y: number; count: number; color: PlayerColor }[] = [];
    const seen = new Set<string>();

    for (const { token, x, y, stackCount } of tokenRenders) {
      const key = `${token.color}-${token.pathPosition}`;
      if (stackCount >= 2 && !seen.has(key)) {
        seen.add(key);
        badges.push({ x, y, count: stackCount, color: token.color });
      }
    }
    return badges;
  }, [tokenRenders]);

  return (
    <svg
      viewBox={`0 0 ${BOARD_PX} ${BOARD_PX}`}
      style={{ touchAction: 'manipulation' }}
    >
      <defs>
        {/* Token gradients for 3D look */}
        {activeColors.map(color => (
          <radialGradient key={`grad-${color}`} id={`tokenGrad-${color}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={SATURATED[color].light} />
            <stop offset="50%" stopColor={SATURATED[color].main} />
            <stop offset="100%" stopColor={SATURATED[color].dark} />
          </radialGradient>
        ))}
        {/* Home column gradients */}
        {activeColors.map(color => (
          <linearGradient key={`homeGrad-${color}`} id={`homeGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={SATURATED[color].main} stopOpacity="0.8" />
            <stop offset="100%" stopColor={SATURATED[color].dark} stopOpacity="0.9" />
          </linearGradient>
        ))}
        {/* Board shadow */}
        <filter id="boardShadow">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3" />
        </filter>
        {/* Star glow */}
        <filter id="starGlow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Board container with rounded corners and shadow */}
      <rect width={BOARD_PX} height={BOARD_PX} rx="24" fill="#F8F6F0" filter="url(#boardShadow)" />
      <rect width={BOARD_PX} height={BOARD_PX} rx="24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />

      {/* Saturated base quadrants */}
      {activeColors.filter(c => BASE_CENTERS[c] && (c === 'red' || c === 'green' || c === 'yellow' || c === 'blue')).map(color => {
        const basePos: Record<string, { x: number; y: number }> = {
          red: { x: 0, y: 0 },
          green: { x: 9 * CELL, y: 0 },
          yellow: { x: 9 * CELL, y: 9 * CELL },
          blue: { x: 0, y: 9 * CELL },
        };
        const pos = basePos[color];
        if (!pos) return null;
        const sat = SATURATED[color as PlayerColor];
        return (
          <g key={`base-${color}`}>
            {/* Saturated color quadrant */}
            <rect x={pos.x + 4} y={pos.y + 4} width={6 * CELL - 8} height={6 * CELL - 8} rx="16" fill={sat.main} />
            {/* White inner panel */}
            <rect x={pos.x + CELL * 0.8} y={pos.y + CELL * 0.8} width={6 * CELL - CELL * 1.6} height={6 * CELL - CELL * 1.6} rx="12" fill="white" />
            {/* Token slots */}
            {[0, 1, 2, 3].map(i => {
              const slotPos = getBaseTokenPos(color as PlayerColor, i);
              return (
                <circle key={`slot-${color}-${i}`} cx={slotPos.x} cy={slotPos.y} r={14}
                  fill={sat.main} opacity="0.25" stroke={sat.main} strokeWidth="2" />
              );
            })}
          </g>
        );
      })}

      {/* Track cells */}
      {TRACK.map(([col, row], i) => {
        const x = col * CELL;
        const y = row * CELL;
        const startColor = activeColors.find(c => START_OFFSETS[c] === i);
        const fill = startColor ? SATURATED[startColor].main : '#FFFFFF';
        return (
          <rect key={`track-${i}`} x={x + 1} y={y + 1} width={CELL - 2} height={CELL - 2}
            rx="5" fill={fill} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
        );
      })}

      {/* Home columns with gradient */}
      {activeColors.filter(c => HOME_COLUMNS[c]).map(color => (
        <g key={`homecol-${color}`}>
          {HOME_COLUMNS[color].map(([col, row], i) => (
            <rect key={`hc-${color}-${i}`} x={col * CELL + 1} y={row * CELL + 1}
              width={CELL - 2} height={CELL - 2} rx="5"
              fill={`url(#homeGrad-${color})`} />
          ))}
        </g>
      ))}

      {/* Center pinwheel - saturated */}
      {renderCenter(activeColors)}

      {/* Safe cell golden stars */}
      {getSafeCellPositions(activeColors, layout).map(({ x, y, key }) => (
        <text key={`star-${key}`} x={x} y={y + 6} textAnchor="middle" fontSize="18"
          fill="#F59E0B" filter="url(#starGlow)" fontWeight="bold">★</text>
      ))}

      {/* Entry arrows - colored chevrons */}
      {activeColors.map(color => {
        const entryIdx = (START_OFFSETS[color] - 1 + 52) % 52;
        const cell = TRACK[entryIdx];
        if (!cell) return null;
        const pos = getCellCenter(cell[0], cell[1]);
        return (
          <g key={`arrow-${color}`}>
            <text x={pos.x} y={pos.y + 5} textAnchor="middle" fontSize="14"
              fill={SATURATED[color].main} fontWeight="bold" opacity="0.8">
              ▶
              <animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite" />
            </text>
          </g>
        );
      })}

      {/* 3D Tokens */}
      {tokenRenders.map(({ token, x, y, isLegal }) => (
        <g key={token.id} data-token-id={token.id} transform={`translate(${x}, ${y})`}
          onClick={() => isLegal && onTokenClick(token.id)}
          style={{ cursor: isLegal ? 'pointer' : 'default' }}>
          {/* Pulsing halo for legal moves */}
          {isLegal && (
            <circle r={20} fill="none" stroke={SATURATED[token.color].main} strokeWidth="2.5" opacity="0.6">
              <animate attributeName="r" values="18;23;18" dur="1.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}
          {/* Shadow ellipse */}
          <ellipse cx={1} cy={5} rx={10} ry={4} fill="rgba(0,0,0,0.2)" />
          {/* Token body with radial gradient */}
          <circle r={isLegal ? 13 : 11} fill={`url(#tokenGrad-${token.color})`} stroke="white" strokeWidth="2.5" />
          {/* Specular highlight */}
          <ellipse cx={-3} cy={-3} rx={4} ry={3} fill="white" opacity="0.5" />
          {/* Inner dot */}
          <circle r={3} fill="white" opacity="0.7" />
          {/* Gentle bob for legal tokens */}
          {isLegal && (
            <animateTransform attributeName="transform" type="translate" values={`${x},${y};${x},${y - 2};${x},${y}`}
              dur="1s" repeatCount="indefinite" additive="replace" />
          )}
        </g>
      ))}

      {/* Stack badges */}
      {stackBadges.map(({ x, y, count, color }, i) => (
        <g key={`badge-${i}`} transform={`translate(${x + 12}, ${y - 12})`}>
          <circle r={9} fill="rgba(0,0,0,0.8)" stroke="white" strokeWidth="2" />
          <text textAnchor="middle" dy="4" fontSize="11" fontWeight="bold" fill="white">{count}</text>
        </g>
      ))}
    </svg>
  );
};

function getSafeCellPositions(activeColors: PlayerColor[], layout: BoardLayout): { x: number; y: number; key: string }[] {
  const positions: { x: number; y: number; key: string }[] = [];
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
          positions.push({ ...pos, key });
        }
      }
    }
  }
  return positions;
}

function renderCenter(activeColors: PlayerColor[]): React.ReactNode {
  const cx = 7.5 * CELL;
  const cy = 7.5 * CELL;
  const size = CELL * 1.5;

  const elements: React.ReactNode[] = [
    <rect key="center-bg" x={cx - size} y={cy - size} width={size * 2} height={size * 2}
      fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth="1" rx="8" />
  ];

  if (activeColors.length <= 4) {
    const triangles: { color: PlayerColor; path: string }[] = [
      { color: 'red', path: `M ${cx} ${cy} L ${cx - size} ${cy - size} L ${cx + size} ${cy - size} Z` },
      { color: 'green', path: `M ${cx} ${cy} L ${cx + size} ${cy - size} L ${cx + size} ${cy + size} Z` },
      { color: 'yellow', path: `M ${cx} ${cy} L ${cx + size} ${cy + size} L ${cx - size} ${cy + size} Z` },
      { color: 'blue', path: `M ${cx} ${cy} L ${cx - size} ${cy + size} L ${cx - size} ${cy - size} Z` },
    ];
    triangles.filter(t => activeColors.includes(t.color)).forEach(t => {
      elements.push(
        <path key={`tri-${t.color}`} d={t.path} fill={SATURATED[t.color].main} opacity="0.85" />
      );
    });
  } else {
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
          fill={SATURATED[color].main} opacity="0.8" />
      );
    });
  }

  // Glossy radial highlight
  elements.push(
    <circle key="center-highlight" cx={cx} cy={cy} r={size * 0.6}
      fill="url(#centerGloss)" opacity="0.3" />
  );
  elements.push(
    <circle key="center-dot" cx={cx} cy={cy} r={8} fill="white" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
  );

  return (
    <g>
      <defs>
        <radialGradient id="centerGloss" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      {elements}
    </g>
  );
}

export default Board;
