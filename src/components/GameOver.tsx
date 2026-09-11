/**
 * Game Over screen - shows winner, rankings, and options.
 */

import React from 'react';
import { PlayerColor, COLOR_HEX } from '../config/constants';

interface GameOverProps {
  winner: PlayerColor;
  rankings: PlayerColor[];
  playerNames: Record<PlayerColor, string>;
  onRematch: () => void;
  onNewGame: () => void;
  onMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ winner, rankings, playerNames, onRematch, onNewGame, onMenu }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#F6F4EF]">
      {/* Crown */}
      <div className="text-6xl mb-4">👑</div>

      {/* Winner */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          <span style={{ color: COLOR_HEX[winner] }} className="capitalize">{playerNames[winner] || winner}</span>
          {' '}Wins!
        </h2>
        <p className="text-gray-500">Congratulations!</p>
      </div>

      {/* Rankings */}
      {rankings.length > 1 && (
        <div className="w-full max-w-xs mb-8">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Rankings</h3>
          <div className="space-y-2">
            {rankings.map((color, i) => (
              <div key={color} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                <span className="text-lg font-bold text-gray-400 w-8">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: COLOR_HEX[color] }}
                />
                <span className="font-medium text-gray-700 capitalize">
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
          className="w-full py-4 px-6 bg-green-600 text-white rounded-2xl font-semibold text-lg shadow-md hover:bg-green-700 active:scale-95 transition-all"
        >
          🔄 Rematch
        </button>
        <button
          onClick={onNewGame}
          className="w-full py-4 px-6 bg-[#34A8E8] text-white rounded-2xl font-semibold text-lg shadow-md hover:bg-blue-500 active:scale-95 transition-all"
        >
          🎲 New Game
        </button>
        <button
          onClick={onMenu}
          className="w-full py-4 px-6 bg-white text-gray-700 rounded-2xl font-semibold text-lg shadow-md border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
        >
          🏠 Main Menu
        </button>
      </div>
    </div>
  );
};

export default GameOver;
