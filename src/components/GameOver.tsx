/**
 * Game Over screen - confetti rain, bouncing trophy, staggered rank cards.
 */

import React, { useEffect } from 'react';
import { PlayerColor, COLOR_HEX } from '../config/constants';

interface GameOverProps {
  winner: PlayerColor;
  rankings: PlayerColor[];
  playerNames: Record<PlayerColor, string>;
  onRematch: () => void;
  onNewGame: () => void;
  onMenu: () => void;
}

const TrophyIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const GameOver: React.FC<GameOverProps> = ({ winner, rankings, playerNames, onRematch, onNewGame, onMenu }) => {
  // Confetti rain effect
  useEffect(() => {
    const colors = ['#E23A3A', '#16A34A', '#EAB308', '#2563EB', '#8B5CF6', '#F97316'];
    const confetti: HTMLDivElement[] = [];

    for (let i = 0; i < 50; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = `${Math.random() * 100}%`;
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.animationDelay = `${Math.random() * 2}s`;
      el.style.animationDuration = `${2 + Math.random() * 2}s`;
      el.style.width = `${6 + Math.random() * 8}px`;
      el.style.height = `${6 + Math.random() * 8}px`;
      el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(el);
      confetti.push(el);
    }

    return () => {
      confetti.forEach(el => el.remove());
    };
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="screen flex flex-col items-center justify-center relative overflow-hidden screen-enter">
      {/* Trophy */}
      <div className="trophy-bounce mb-6">
        <TrophyIcon />
      </div>

      {/* Winner */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black text-white mb-2">
          <span style={{ color: COLOR_HEX[winner] }} className="capitalize">
            {playerNames[winner] || winner}
          </span>
        </h2>
        <p className="text-2xl font-bold text-yellow-400">Wins!</p>
      </div>

      {/* Rankings */}
      {rankings.length > 1 && (
        <div className="w-full max-w-xs mb-8">
          <h3 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Rankings</h3>
          <div className="space-y-3">
            {rankings.map((color, i) => (
              <div
                key={color}
                className="rank-card settings-card flex items-center gap-4 rounded-2xl p-4"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-2xl font-bold w-10 text-center">
                  {getMedal(i)}
                </span>
                <div
                  className="w-8 h-8 rounded-full shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${COLOR_HEX[color]} 0%, ${COLOR_HEX[color]}cc 100%)` }}
                />
                <span className="font-bold text-white capitalize flex-1">
                  {playerNames[color] || color}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onRematch}
          className="btn-primary w-full py-4 px-6 text-white rounded-2xl font-bold text-lg relative overflow-hidden"
        >
          <span className="relative z-10">🔄 Rematch</span>
        </button>
        <button
          onClick={onNewGame}
          className="btn-primary w-full py-4 px-6 text-white rounded-2xl font-bold text-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' }}
        >
          <span className="relative z-10">🎲 New Game</span>
        </button>
        <button
          onClick={onMenu}
          className="btn-secondary w-full py-4 px-6 text-gray-800 rounded-2xl font-bold text-lg"
        >
          <span className="relative z-10">🏠 Main Menu</span>
        </button>
      </div>
    </div>
  );
};

export default GameOver;
