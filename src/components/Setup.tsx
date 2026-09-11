/**
 * Setup screen - choose player count, assign names and colors.
 * Sticky CTA, labels inside cards, no clipping.
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
    <div className="screen screen-enter">
      <button
        onClick={onBack}
        className="mb-4 text-white/70 hover:text-white flex items-center gap-2 text-base font-medium transition-colors"
      >
        <BackIcon /> Back
      </button>

      <h2 className="text-3xl font-black text-white mb-6">New Game</h2>

      {/* Mode selector - segmented control */}
      <div className="segmented-control flex gap-1 mb-8 p-1.5 rounded-2xl w-fit relative">
        {([2, 3, 4, 6] as GameMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              relative w-16 h-14 rounded-xl font-bold text-lg transition-all z-10
              ${mode === m ? 'text-white' : 'text-white/60 hover:text-white/80'}
            `}
          >
            {mode === m && (
              <div className="segment-thumb absolute inset-0 rounded-xl" />
            )}
            <span className="relative z-10">{m}P</span>
          </button>
        ))}
      </div>

      {/* Player setup */}
      <div className="w-full max-w-sm space-y-3 mb-4">
        {activeColors.map((color, i) => (
          <div
            key={color}
            className="settings-card flex items-center gap-3 rounded-2xl p-4 overflow-hidden"
          >
            {/* Gradient number chip with color ring */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg relative"
              style={{
                background: `linear-gradient(135deg, ${COLOR_HEX[color]} 0%, ${COLOR_HEX[color]}cc 100%)`,
                boxShadow: `0 0 0 3px ${COLOR_HEX[color]}40, 0 4px 12px ${COLOR_HEX[color]}60`
              }}
            >
              {i + 1}
            </div>
            {/* Name input - glows in player color on focus */}
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={names[color]}
              onChange={e => setNames(prev => ({ ...prev, [color]: e.target.value }))}
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-transparent font-medium transition-shadow"
              style={{
                boxShadow: 'none'
              }}
              onFocus={e => {
                e.target.style.boxShadow = `0 0 0 2px ${COLOR_HEX[color]}80`;
              }}
              onBlur={e => {
                e.target.style.boxShadow = 'none';
              }}
              maxLength={15}
            />
            {/* Color label - inside card, right-aligned */}
            <span
              className="text-xs font-bold uppercase tracking-wide shrink-0"
              style={{ color: COLOR_HEX[color] }}
            >
              {color}
            </span>
          </div>
        ))}
      </div>

      {/* Sticky CTA - always reachable */}
      <div className="sticky-cta">
        <button
          onClick={handleStart}
          className="btn-primary w-full py-4 px-6 text-white rounded-xl font-bold text-lg relative overflow-hidden"
        >
          <span className="relative z-10">Start Game →</span>
        </button>
      </div>
    </div>
  );
};

export default Setup;
