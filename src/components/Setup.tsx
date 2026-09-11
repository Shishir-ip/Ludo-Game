/**
 * Setup screen - choose player count, assign names and colors. Rich visual design.
 */

import React, { useState } from 'react';
import { GameMode, PlayerColor, MODE_COLORS, COLOR_HEX, ALL_COLORS } from '../config/constants';
import { loadPlayerNames } from '../services/storage';

interface SetupProps {
  onStart: (mode: GameMode, names: Record<PlayerColor, string>) => void;
  onBack: () => void;
}

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const Setup: React.FC<SetupProps> = ({ onStart, onBack }) => {
  const [mode, setMode] = useState<GameMode>(4);
  const savedNames = loadPlayerNames();
  const [names, setNames] = useState<Record<PlayerColor, string>>(() => {
    const initial: Record<string, string> = {};
    ALL_COLORS.forEach(c => { initial[c] = savedNames[c] || ''; });
    return initial as Record<PlayerColor, string>;
  });

  const activeColors = MODE_COLORS[mode];

  const handleStart = () => {
    const finalNames: Record<PlayerColor, string> = {} as Record<PlayerColor, string>;
    activeColors.forEach((color, i) => {
      finalNames[color] = names[color] || `Player ${i + 1}`;
    });
    onStart(mode, finalNames);
  };

  return (
    <div className="min-h-screen flex flex-col p-6 screen-enter overflow-y-auto" style={{ maxHeight: '100dvh' }}>
      <button
        onClick={onBack}
        className="self-start mb-4 text-white/70 hover:text-white flex items-center gap-2 text-base font-medium transition-colors"
      >
        <BackIcon /> Back
      </button>

      <h2 className="text-3xl font-black text-white mb-6">New Game</h2>

      {/* Mode selector - segmented control */}
      <div className="segmented-control flex gap-1 mb-8 p-1.5 rounded-2xl w-fit relative">
        {([2, 3, 4, 6] as GameMode[]).map((m, idx) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              relative w-16 h-14 rounded-xl font-bold text-lg transition-all z-10
              ${mode === m ? 'text-white' : 'text-white/60 hover:text-white/80'}
            `}
          >
            {mode === m && (
              <div
                className="segment-thumb absolute inset-0 rounded-xl"
                style={{ transitionDelay: '0ms' }}
              />
            )}
            <span className="relative z-10">{m}P</span>
          </button>
        ))}
      </div>

      {/* Player setup */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {activeColors.map((color, i) => (
          <div key={color} className="settings-card flex items-center gap-3 rounded-2xl p-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${COLOR_HEX[color]} 0%, ${COLOR_HEX[color]}cc 100%)` }}
            >
              {i + 1}
            </div>
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={names[color]}
              onChange={e => setNames(prev => ({ ...prev, [color]: e.target.value }))}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
              maxLength={15}
            />
            <span className="text-sm font-bold capitalize" style={{ color: COLOR_HEX[color] }}>
              {color}
            </span>
          </div>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="btn-primary w-full max-w-sm py-4 px-6 text-white rounded-2xl font-bold text-lg relative overflow-hidden"
      >
        <span className="relative z-10">Start Game →</span>
      </button>
    </div>
  );
};

export default Setup;
