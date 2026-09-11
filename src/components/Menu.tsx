/**
 * Menu screen - main entry point with Play, Settings, and Stats options.
 */

import React from 'react';
import { hasSavedGame } from '../services/storage';

interface MenuProps {
  onPlay: () => void;
  onResume: () => void;
  onSettings: () => void;
  onStats: () => void;
}

const Menu: React.FC<MenuProps> = ({ onPlay, onResume, onSettings, onStats }) => {
  const hasSave = hasSavedGame();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F6F4EF]">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#E23A3A]" />
          <div className="w-8 h-8 rounded-full bg-[#2E9E44]" />
          <div className="w-8 h-8 rounded-full bg-[#34A8E8]" />
          <div className="w-8 h-8 rounded-full bg-[#F2CE00]" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Ludo</h1>
        <p className="text-gray-500 text-sm mt-1">Pass & Play • Offline Ready</p>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-xs space-y-3">
        {hasSave && (
          <button
            onClick={onResume}
            className="w-full py-4 px-6 bg-green-600 text-white rounded-2xl font-semibold text-lg shadow-md hover:bg-green-700 active:scale-95 transition-all"
          >
            ▶ Resume Game
          </button>
        )}
        <button
          onClick={onPlay}
          className="w-full py-4 px-6 bg-[#34A8E8] text-white rounded-2xl font-semibold text-lg shadow-md hover:bg-blue-500 active:scale-95 transition-all"
        >
          🎲 New Game
        </button>
        <button
          onClick={onSettings}
          className="w-full py-4 px-6 bg-white text-gray-700 rounded-2xl font-semibold text-lg shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
        >
          ⚙️ Settings
        </button>
        <button
          onClick={onStats}
          className="w-full py-4 px-6 bg-white text-gray-700 rounded-2xl font-semibold text-lg shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
        >
          🏆 Statistics
        </button>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center">
        2–6 players • One device • No internet needed
      </p>
    </div>
  );
};

export default Menu;
