/**
 * Pure game rules engine. No DOM, no side effects.
 * getLegalMoves() and applyMove() are the core API.
 */

import { PlayerColor, GameMode, GameSettings, TOKENS_PER_PLAYER, DEFAULT_SETTINGS } from '../config/constants';
import { BoardLayout, getBoardLayout, getActiveColors } from './paths';

export interface TokenState {
  id: string; // e.g. "red-0"
  color: PlayerColor;
  index: number; // token index 0-3
  pathPosition: number; // -1 = in base, 0-57 = on path (classic), 0-77 = on path (hex)
  finished: boolean;
}

export interface PlayerState {
  color: PlayerColor;
  name: string;
  tokens: TokenState[];
  finished: boolean;
  rank: number | null;
}

export interface GameState {
  mode: GameMode;
  players: PlayerState[];
  activeColors: PlayerColor[];
  currentPlayerIndex: number;
  diceValue: number | null;
  consecutiveSixes: number;
  settings: GameSettings;
  layout: BoardLayout;
  winner: PlayerColor | null;
  rankings: PlayerColor[];
  turnCount: number;
}

export interface MoveEffect {
  type: 'capture' | 'home' | 'extra_turn' | 'enter';
  tokenId: string;
  capturedTokens?: string[];
}

export interface LegalMove {
  tokenId: string;
  from: number;
  to: number;
  effects: MoveEffect[];
}

export function createInitialState(mode: GameMode, playerNames: Record<PlayerColor, string>, settings?: GameSettings): GameState {
  const layout = getBoardLayout(mode);
  const activeColors = getActiveColors(mode);
  const s = settings || DEFAULT_SETTINGS;

  const players: PlayerState[] = activeColors.map(color => ({
    color,
    name: playerNames[color] || color.charAt(0).toUpperCase() + color.slice(1),
    tokens: Array.from({ length: TOKENS_PER_PLAYER }, (_, i) => ({
      id: `${color}-${i}`,
      color,
      index: i,
      pathPosition: -1, // in base
      finished: false,
    })),
    finished: false,
    rank: null,
  }));

  return {
    mode,
    players,
    activeColors,
    currentPlayerIndex: 0,
    diceValue: null,
    consecutiveSixes: 0,
    settings: s,
    layout,
    winner: null,
    rankings: [],
    turnCount: 0,
  };
}

export function getCurrentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

export function getLegalMoves(state: GameState, roll: number): LegalMove[] {
  const player = getCurrentPlayer(state);
  if (player.finished) return [];

  const moves: LegalMove[] = [];
  const layout = state.layout;

  for (const token of player.tokens) {
    if (token.finished) continue;

    if (token.pathPosition === -1) {
      // Token in base: need 6 to enter
      if (roll === 6) {
        const enterPos = 0; // start cell on path (relative to this color)
        const effects: MoveEffect[] = [{ type: 'enter', tokenId: token.id }];
        // Check if start cell has opponent tokens (capture on entry)
        const captureEffects = checkCapture(state, token.color, enterPos, layout);
        effects.push(...captureEffects);
        if (captureEffects.some(e => e.type === 'capture')) {
          effects.push({ type: 'extra_turn', tokenId: token.id });
        }
        moves.push({ tokenId: token.id, from: -1, to: enterPos, effects });
      }
    } else {
      // Token on board
      const newPathPos = token.pathPosition + roll;

      // Check if overshooting center
      if (newPathPos > layout.pathSize - 1) {
        continue; // Can't move, overshoot
      }

      // Check if landing on center (home)
      if (newPathPos === layout.pathSize - 1) {
        const effects: MoveEffect[] = [
          { type: 'home', tokenId: token.id },
          { type: 'extra_turn', tokenId: token.id },
        ];
        moves.push({ tokenId: token.id, from: token.pathPosition, to: newPathPos, effects });
        continue;
      }

      // Check if in home column (safe, no capture)
      if (layout.isHomeColumn(token.color, newPathPos)) {
        moves.push({ tokenId: token.id, from: token.pathPosition, to: newPathPos, effects: [] });
        continue;
      }

      // Normal move on main loop
      const loopPos = newPathPos % layout.loopSize;
      const effects: MoveEffect[] = [];

      // Check capture
      const captureEffects = checkCapture(state, token.color, loopPos, layout);
      effects.push(...captureEffects);
      if (captureEffects.some(e => e.type === 'capture')) {
        effects.push({ type: 'extra_turn', tokenId: token.id });
      }

      moves.push({ tokenId: token.id, from: token.pathPosition, to: newPathPos, effects });
    }
  }

  return moves;
}

function checkCapture(state: GameState, movingColor: PlayerColor, landingPathPos: number, layout: BoardLayout): MoveEffect[] {
  const effects: MoveEffect[] = [];

  // Can't capture in home column
  if (landingPathPos >= layout.loopSize) return effects;

  // The landing position on the main loop (relative to the moving color)
  // We need to convert to absolute loop position to compare with other tokens
  const movingAbsPos = (layout.starts[movingColor] + landingPathPos) % layout.loopSize;

  // Can't capture on safe cells (check absolute positions)
  const allSafeAbsCells = new Set<number>();
  for (const color of state.activeColors) {
    for (const sc of layout.safeCells(color)) {
      const absSafe = (layout.starts[color] + sc) % layout.loopSize;
      allSafeAbsCells.add(absSafe);
    }
  }
  if (allSafeAbsCells.has(movingAbsPos)) return effects;

  // Check for opponent tokens on the same absolute cell
  const capturedTokens: string[] = [];
  for (const player of state.players) {
    if (player.color === movingColor) continue;
    for (const token of player.tokens) {
      if (token.pathPosition >= 0 && !token.finished && token.pathPosition < layout.loopSize) {
        // Convert opponent's relative position to absolute
        const opponentAbsPos = (layout.starts[token.color] + token.pathPosition) % layout.loopSize;
        if (opponentAbsPos === movingAbsPos) {
          capturedTokens.push(token.id);
        }
      }
    }
  }

  if (capturedTokens.length > 0) {
    effects.push({ type: 'capture', tokenId: '', capturedTokens });
  }

  return effects;
}

export function applyMove(state: GameState, move: LegalMove, roll: number): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  newState.layout = getBoardLayout(state.mode); // restore non-serializable
  const player = getCurrentPlayer(newState);
  const token = player.tokens.find(t => t.id === move.tokenId)!;
  const events: string[] = [];

  // Move token
  token.pathPosition = move.to;

  // Process effects
  let extraTurn = false;
  for (const effect of move.effects) {
    switch (effect.type) {
      case 'enter':
        events.push('enter');
        break;
      case 'home':
        token.finished = true;
        token.pathPosition = newState.layout.pathSize - 1;
        events.push('home');
        extraTurn = true;
        // Check if player finished all tokens
        if (player.tokens.every(t => t.finished)) {
          player.finished = true;
          player.rank = newState.rankings.length + 1;
          newState.rankings.push(player.color);
          if (newState.rankings.length === 1) {
            newState.winner = player.color;
          }
          if (!newState.settings.continueForRanks) {
            // Game over
          }
        }
        break;
      case 'capture':
        if (effect.capturedTokens) {
          for (const capturedId of effect.capturedTokens) {
            for (const p of newState.players) {
              const captured = p.tokens.find(t => t.id === capturedId);
              if (captured) {
                captured.pathPosition = -1;
                captured.finished = false;
              }
            }
          }
          events.push('capture');
          extraTurn = true;
        }
        break;
      case 'extra_turn':
        extraTurn = true;
        break;
    }
  }

  // Handle six
  if (roll === 6) {
    newState.consecutiveSixes++;
    if (newState.settings.threeSixesAbort && newState.consecutiveSixes >= 3) {
      // Third six: forfeit turn, no extra turn
      extraTurn = false;
      events.push('three_sixes');
    } else {
      extraTurn = true;
    }
  } else {
    newState.consecutiveSixes = 0;
  }

  // If no extra turn, advance to next player
  if (!extraTurn) {
    newState.consecutiveSixes = 0;
    advanceTurn(newState);
    newState.diceValue = null; // Clear dice for next player's turn
  } else {
    newState.diceValue = roll; // Keep dice value so player can roll again (or see the 6)
    // Actually for extra turn, player needs to roll again
    newState.diceValue = null;
  }

  newState.turnCount++;

  return newState;
}

function advanceTurn(state: GameState): void {
  const totalPlayers = state.players.length;
  let next = (state.currentPlayerIndex + 1) % totalPlayers;
  let attempts = 0;

  while (state.players[next].finished && attempts < totalPlayers) {
    next = (next + 1) % totalPlayers;
    attempts++;
  }

  // Check if game is over (all but one finished, or only one player left)
  const unfinished = state.players.filter(p => !p.finished);
  if (unfinished.length <= 1 && state.rankings.length >= 1) {
    if (unfinished.length === 1) {
      unfinished[0].rank = state.rankings.length + 1;
      state.rankings.push(unfinished[0].color);
    }
    return; // Game over handled by UI
  }

  state.currentPlayerIndex = next;
}

export function isGameOver(state: GameState): boolean {
  if (!state.settings.continueForRanks) {
    return state.winner !== null;
  }
  return state.players.every(p => p.finished);
}

export function handleNoMoves(state: GameState): GameState {
  const newState: GameState = {
    ...state,
    players: state.players.map(p => ({ ...p, tokens: p.tokens.map(t => ({ ...t })) })),
    rankings: [...state.rankings],
  };
  newState.consecutiveSixes = 0;
  advanceTurn(newState);
  return newState;
}
