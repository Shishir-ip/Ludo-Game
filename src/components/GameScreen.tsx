/**
 * Main game screen - board, dice, turn management, and game flow.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { PlayerColor, GameMode, COLOR_HEX, GameSettings } from '../config/constants';
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
import Board from './Board';
import Dice from './Dice';
import { saveGameState, clearGameState, recordWin } from '../services/storage';
import { playHop, playCapture, playHome, playWin, haptic } from '../services/audio';

interface GameScreenProps {
  initialState: GameState;
  onGameOver: (state: GameState) => void;
  onQuit: () => void;
  onMenu: () => void;
}

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
  stateRef.current = state;

  const currentPlayer = getCurrentPlayer(state);

  // Execute a move (uses ref to avoid stale closure)
  const executeMoveRef = useRef<(move: LegalMove) => void>();
  executeMoveRef.current = (move: LegalMove) => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const currentState = stateRef.current;
    const hasCapture = move.effects.some(e => e.type === 'capture');
    const hasHome = move.effects.some(e => e.type === 'home');

    if (hasCapture) playCapture();
    else if (hasHome) playHome();
    else playHop();

    haptic(hasCapture ? [50, 30, 50] : 30);

    setTimeout(() => {
      const newState = applyMove(currentState, move, currentState.diceValue!);
      newState.layout = getBoardLayout(currentState.mode);
      setState(newState);
      setSelectedToken(null);
      animatingRef.current = false;
      saveGameState(newState);
    }, 250);
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
        playWin();
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

  return (
    <div className="h-screen w-screen flex flex-col bg-[#F6F4EF] overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0">
        <button
          onClick={() => setShowMenu(true)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white shadow-sm border border-gray-200 text-gray-600"
        >
          ☰
        </button>

        {/* Current player indicator */}
        <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
          <div
            className="w-5 h-5 rounded-full shadow-sm"
            style={{ backgroundColor: COLOR_HEX[currentPlayer.color] }}
          />
          <span className="font-semibold text-gray-700 text-sm">
            {currentPlayer.name}'s turn
          </span>
        </div>

        <div className="w-10" />
      </div>

      {/* Message toast */}
      {message && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg z-20 animate-pulse">
          {message}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 flex items-center justify-center p-2 min-h-0">
        <Board
          state={state}
          legalMoves={legalMoves}
          onTokenClick={handleTokenClick}
          selectedToken={selectedToken}
        />
      </div>

      {/* Player status bar */}
      <div className="shrink-0 flex items-center justify-center gap-2 px-4 py-1 flex-wrap">
        {state.players.map(p => {
          const homeCount = p.tokens.filter(t => t.finished).length;
          const isCurrent = p.color === currentPlayer.color;
          return (
            <div key={p.color} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${isCurrent ? 'bg-white shadow-sm border border-gray-200 scale-105' : 'opacity-60'}`}>
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_HEX[p.color] }} />
              <span className="text-gray-600">{homeCount}/4</span>
              {p.finished && <span className="text-green-600">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 flex flex-col items-center gap-3 pb-4 pt-2">
        {/* Dice */}
        <Dice
          value={state.diceValue}
          onRoll={rollDice}
          disabled={state.diceValue !== null || rolling}
          rolling={rolling}
        />

        {/* Status text */}
        {state.diceValue !== null && !rolling && (
          <p className="text-sm text-gray-500 font-medium">
            {legalMoves.length > 0 ? 'Tap a glowing token to move' : 'No moves...'}
          </p>
        )}

        {state.diceValue === null && !rolling && (
          <p className="text-sm text-gray-500 font-medium">
            Tap dice or press Space to roll
          </p>
        )}

        {/* Consecutive sixes indicator */}
        {state.consecutiveSixes > 0 && (
          <div className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full">
            {Array.from({ length: state.consecutiveSixes }).map((_, i) => (
              <span key={i} className="text-yellow-600 font-bold text-sm">6</span>
            ))}
            {state.settings.threeSixesAbort && state.consecutiveSixes === 2 && (
              <span className="text-xs text-yellow-700 ml-1">⚠️ One more = forfeit!</span>
            )}
          </div>
        )}
      </div>

      {/* In-game menu modal */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={() => setShowMenu(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Game Menu</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowMenu(false)}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
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
                className="w-full py-3 px-4 bg-yellow-100 text-yellow-800 rounded-xl font-medium hover:bg-yellow-200 transition-all"
              >
                🔄 Restart
              </button>
              <button
                onClick={() => {
                  clearGameState();
                  onMenu();
                }}
                className="w-full py-3 px-4 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-all"
              >
                🏠 Quit to Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
