/**
 * Main game screen - mobile-safe layout with grid system.
 * Dice pod moves to current player's base corner.
 * Per-step hopping sounds during token movement.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlayerColor, COLOR_HEX } from '../config/constants';
import {
  GameState,
  LegalMove,
  createInitialState,
  getLegalMoves,
  applyMove,
  getCurrentPlayer,
  isGameOver,
  handleNoMoves,
} from '../core/engine';
import { getBoardLayout } from '../core/paths';
import Board, { cellCenter } from './Board';
import Dice from './Dice';
import { saveGameState, clearGameState, recordWin } from '../services/storage';
import { sfx, haptic, setMuted } from '../services/audio';
import { hopPath, burst, screenShake, getSpeedMultiplier, prefersReducedMotion } from '../render/animations';

interface GameScreenProps {
  initialState: GameState;
  onGameOver: (state: GameState) => void;
  onQuit: () => void;
  onMenu: () => void;
}

// Dice pod anchor positions (% of board)
const POD_ANCHORS: Record<PlayerColor, { left: string; top: string; translate: string }> = {
  red: { left: '4%', top: '4%', translate: '0, 0' },
  green: { left: '96%', top: '4%', translate: '-100%, 0' },
  yellow: { left: '96%', top: '96%', translate: '-100%, -100%' },
  blue: { left: '4%', top: '96%', translate: '0, -100%' },
  purple: { left: '4%', top: '4%', translate: '0, 0' },
  orange: { left: '96%', top: '4%', translate: '-100%, 0' },
};

const GameScreen: React.FC<GameScreenProps> = ({ initialState, onGameOver, onQuit, onMenu }) => {
  const [state, setState] = useState<GameState>(() => ({
    ...initialState,
    layout: getBoardLayout(initialState.mode),
  }));
  const [legalMoves, setLegalMoves] = useState<LegalMove[]>([]);
  const [rolling, setRolling] = useState(false);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const animatingRef = useRef(false);
  const stateRef = useRef(state);
  const boardRef = useRef<HTMLDivElement>(null);
  stateRef.current = state;

  const currentPlayer = getCurrentPlayer(state);
  const speedMult = getSpeedMultiplier(state.settings.animationSpeed);

  // Execute a move with animation and per-step sounds
  const executeMoveRef = useRef<(move: LegalMove) => void>();
  executeMoveRef.current = async (move: LegalMove) => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const currentState = stateRef.current;
    const hasCapture = move.effects.some(e => e.type === 'capture');
    const hasHome = move.effects.some(e => e.type === 'home');

    // Get token element for animation
    const tokenEl = document.querySelector(`[data-token-id="${move.tokenId}"]`) as SVGElement | null;

    if (tokenEl && !prefersReducedMotion()) {
      const token = currentState.players
        .flatMap(p => p.tokens)
        .find(t => t.id === move.tokenId);

      if (token) {
        const points: { x: number; y: number; cellSize?: number }[] = [];

        if (move.from === -1) {
          const basePos = getBasePosition(token.color, token.index);
          points.push({ ...basePos, cellSize: 40 });
          sfx.baseExit();
        } else {
          const fromPos = cellCenter(token.color, move.from, currentState.layout);
          points.push({ ...fromPos, cellSize: 40 });
        }

        const toPos = cellCenter(token.color, move.to, currentState.layout);
        points.push({ ...toPos, cellSize: 40 });

        // Animate hop with per-step sounds
        if (points.length >= 2) {
          await hopPath(tokenEl, points, 150, speedMult, (stepIndex) => {
            sfx.step(stepIndex);
          });
        }
      }
    }

    // Sound effects
    if (hasCapture) {
      sfx.capture();
      haptic([50, 30, 50]);
      if (boardRef.current) {
        screenShake(boardRef.current, speedMult);
      }
      if (tokenEl) {
        const rect = tokenEl.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height / 2, COLOR_HEX[currentPlayer.color], 14);
      }
    } else if (hasHome) {
      sfx.home();
      haptic([30, 50, 30, 50, 30]);
      if (tokenEl) {
        const rect = tokenEl.getBoundingClientRect();
        burst(rect.left + rect.width / 2, rect.top + rect.height / 2, COLOR_HEX[currentPlayer.color], 20);
      }
    }

    // Apply move after animation
    const newState = applyMove(currentState, move, currentState.diceValue!);
    newState.layout = getBoardLayout(currentState.mode);
    setState(newState);
    setSelectedToken(null);
    animatingRef.current = false;
    saveGameState(newState);
  };

  // Calculate legal moves when dice is rolled
  useEffect(() => {
    if (state.diceValue !== null && !rolling && !animatingRef.current) {
      const moves = getLegalMoves(state, state.diceValue);
      setLegalMoves(moves);

      if (moves.length === 0) {
        setMessage('No moves available');
        haptic(100);
        const timer = setTimeout(() => {
          const newState = handleNoMoves(state);
          newState.layout = getBoardLayout(state.mode);
          newState.diceValue = null;
          setState(newState);
          setMessage('');
          setLegalMoves([]);
          saveGameState(newState);
        }, 1000);
        return () => clearTimeout(timer);
      } else if (moves.length === 1 && state.settings.autoMoveSingle) {
        const timer = setTimeout(() => {
          executeMoveRef.current?.(moves[0]);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else if (state.diceValue === null) {
      setLegalMoves([]);
    }
  }, [state.diceValue, state.currentPlayerIndex, rolling]);

  // Check for game over
  useEffect(() => {
    if (isGameOver(state)) {
      if (state.winner) {
        sfx.win();
        recordWin(state.winner);
      }
      clearGameState();
      const timer = setTimeout(() => onGameOver(state), 1500);
      return () => clearTimeout(timer);
    }
  }, [state.winner, state.rankings]);

  const rollDice = useCallback(() => {
    if (rolling || state.diceValue !== null) return;
    setRolling(true);
    setMessage('');
    sfx.roll();

    setTimeout(() => {
      const value = Math.floor(Math.random() * 6) + 1;
      setRolling(false);
      setState(prev => {
        const newState = { ...prev, diceValue: value };
        newState.layout = getBoardLayout(prev.mode);
        return newState;
      });
    }, 700);
  }, [rolling, state.diceValue]);

  const handleTokenClick = useCallback((tokenId: string) => {
    const move = legalMoves.find(m => m.tokenId === tokenId);
    if (move) {
      setSelectedToken(tokenId);
      executeMoveRef.current?.(move);
    }
  }, [legalMoves]);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && state.diceValue === null && !rolling) {
        e.preventDefault();
        rollDice();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [rollDice, state.diceValue, rolling]);

  // Dice pod position
  const podAnchor = POD_ANCHORS[currentPlayer.color] || POD_ANCHORS.red;

  return (
    <div id="screen-game" className="relative z-10">
      {/* Row 1: Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setShowMenu(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18" />
          </svg>
        </button>

        {/* Turn banner */}
        <div
          key={currentPlayer.color}
          className="turn-banner flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            '--player-color': COLOR_HEX[currentPlayer.color],
            '--player-color-dark': COLOR_HEX[currentPlayer.color] + 'cc',
          } as React.CSSProperties}
        >
          <div className="w-5 h-5 rounded-full bg-white/30" />
          <span className="font-bold text-white text-sm">
            {currentPlayer.name}'s turn
          </span>
          {state.diceValue && (
            <div className="ml-2 w-6 h-6 rounded bg-white/20 flex items-center justify-center text-xs font-bold text-white">
              {state.diceValue}
            </div>
          )}
        </div>

        {/* Sound toggle */}
        <button
          onClick={() => {
            const newEnabled = !state.settings.soundEnabled;
            const newSettings = { ...state.settings, soundEnabled: newEnabled };
            setState(prev => ({ ...prev, settings: newSettings }));
            setMuted(!newEnabled);
          }}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          {state.settings.soundEnabled ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      </div>

      {/* Row 2: Board wrapper with dice pod */}
      <div className="board-wrap relative" ref={boardRef}>
        <Board
          state={state}
          legalMoves={legalMoves}
          onTokenClick={handleTokenClick}
          selectedToken={selectedToken}
        />

        {/* Dice pod - floating dice that moves to current player */}
        <div
          className="dice-pod"
          style={{
            left: podAnchor.left,
            top: podAnchor.top,
            transform: `translate(${podAnchor.translate})`,
          }}
        >
          <div className="dice-pod-container">
            <div
              className="dice-pod-ring"
              style={{ borderColor: COLOR_HEX[currentPlayer.color] }}
            />
            <Dice
              value={state.diceValue}
              onRoll={rollDice}
              disabled={state.diceValue !== null || rolling}
              rolling={rolling}
            />
          </div>
          <div className="dice-pod-name">{currentPlayer.name}</div>
        </div>
      </div>

      {/* Row 3: Progress chips */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 flex-wrap" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        {state.players.map(p => {
          const homeCount = p.tokens.filter(t => t.finished).length;
          const isCurrent = p.color === currentPlayer.color;
          return (
            <div
              key={p.color}
              className={`progress-chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${isCurrent ? 'active' : ''}`}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_HEX[p.color] }} />
              <span className="text-white">{homeCount}/4</span>
              {p.finished && <span className="text-green-400">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Message toast */}
      {message && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl z-20 animate-pulse">
          {message}
        </div>
      )}

      {/* Consecutive sixes indicator */}
      {state.consecutiveSixes > 0 && (
        <div className="absolute top-20 right-4 flex items-center gap-1 bg-yellow-500/20 backdrop-blur-sm border border-yellow-500/30 px-3 py-1 rounded-full z-20">
          {Array.from({ length: state.consecutiveSixes }).map((_, i) => (
            <span key={i} className="text-yellow-400 font-bold text-sm">6</span>
          ))}
          {state.settings.threeSixesAbort && state.consecutiveSixes === 2 && (
            <span className="text-xs text-yellow-300 ml-1">⚠️</span>
          )}
        </div>
      )}

      {/* In-game menu modal */}
      {showMenu && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-6" onClick={() => setShowMenu(false)}>
          <div className="modal-content bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black text-white mb-6">Game Menu</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowMenu(false)}
                className="btn-secondary w-full py-3 px-4 text-gray-800 rounded-xl font-bold"
              >
                ▶ Resume
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  const freshState = createInitialState(
                    state.mode,
                    Object.fromEntries(state.players.map(p => [p.color, p.name])) as Record<PlayerColor, string>,
                    state.settings
                  );
                  freshState.layout = getBoardLayout(state.mode);
                  setState(freshState);
                  setLegalMoves([]);
                  clearGameState();
                }}
                className="btn-primary w-full py-3 px-4 text-white rounded-xl font-bold relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' }}
              >
                <span className="relative z-10">🔄 Restart</span>
              </button>
              <button
                onClick={() => {
                  clearGameState();
                  onMenu();
                }}
                className="btn-primary w-full py-3 px-4 text-white rounded-xl font-bold relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' }}
              >
                <span className="relative z-10">🏠 Quit to Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper to get base position for animation
function getBasePosition(color: PlayerColor, tokenIndex: number): { x: number; y: number } {
  const BASE_CENTERS: Record<PlayerColor, [number, number]> = {
    red: [3, 3], green: [12, 3], yellow: [12, 12], blue: [3, 12],
    purple: [3, 3], orange: [12, 3],
  };
  const CELL = 40;
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

export default GameScreen;
