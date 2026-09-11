/**
 * Setup screen - choose player count, assign names and colors.
 */

import React, { useState } from 'react';
import { GameMode, PlayerColor, MODE_COLORS, COLOR_HEX, ALL_COLORS } from '../config/constants';
import { loadPlayerNames } from '../services/storage';

interface SetupProps {
  onStart: (mode: GameMode, names: Record<PlayerColor, string>) => void;
  onBack: () => void;
}

const Setup: React.FC<SetupProps> = ({ onStart, onBack }) => {
  const [mode, setMode] = useState<GameMode>(4);
  const savedNames = loadPlayerNames();
  const [names, setNames] = useState<Record<PlayerColor, string>>(() => {
    const initial: Record<string, string> = {};
    ALL_COLORS.forEach(c => {
      initial[c] = savedNames[c] || '';
    });
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
    <div className="min-h-screen flex flex-col items-center p-6 bg-[#F6F4EF]">
      <button
        onClick={onBack}
        className="self-start mb-4 text-gray-500 hover:text-gray-700 text-lg"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">New Game</h2>

      {/* Mode selector */}
      <div className="flex gap-2 mb-8">
        {([2, 3, 4, 6] as GameMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`
              w-14 h-14 rounded-xl font-bold text-lg transition-all
              ${mode === m
                ? 'bg-[#34A8E8] text-white shadow-md scale-105'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {m}P
          </button>
        ))}
      </div>

      {/* Player setup */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {activeColors.map((color, i) => (
          <div key={color} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: COLOR_HEX[color] }}
            >
              {i + 1}
            </div>
            <input
              type="text"
              placeholder={`Player ${i + 1}`}
              value={names[color]}
              onChange={e => setNames(prev => ({ ...prev, [color]: e.target.value }))}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#34A8E8] focus:border-transparent"
              maxLength={15}
            />
            <span className="text-sm font-medium capitalize" style={{ color: COLOR_HEX[color] }}>
              {color}
            </span>
          </div>
        ))}
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        className="w-full max-w-sm py-4 px-6 bg-green-600 text-white rounded-2xl font-semibold text-lg shadow-md hover:bg-green-700 active:scale-95 transition-all"
      >
        Start Game →
      </button>
    </div>
  );
};

export default Setup;
