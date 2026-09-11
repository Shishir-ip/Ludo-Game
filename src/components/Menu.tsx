/**
 * Menu screen - gradient title with shine, floating parallax shapes, rich visual design.
 */

import React from 'react';
import { hasSavedGame } from '../services/storage';

interface MenuProps {
  onPlay: () => void;
  onResume: () => void;
  onSettings: () => void;
  onStats: () => void;
}

// Inline SVG icons
const DiceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const TrophyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);

const Menu: React.FC<MenuProps> = ({ onPlay, onResume, onSettings, onStats }) => {
  const hasSave = hasSavedGame();

  return (
    <div className="screen flex flex-col items-center justify-center relative overflow-hidden screen-enter">
      {/* Floating background shapes */}
      <div className="floating-shape" style={{ top: '10%', left: '15%', animationDelay: '0s' }}>
        <div className="w-16 h-16 rounded-full bg-red-500" />
      </div>
      <div className="floating-shape" style={{ top: '20%', right: '20%', animationDelay: '3s' }}>
        <div className="w-12 h-12 rounded-full bg-green-500" />
      </div>
      <div className="floating-shape" style={{ bottom: '25%', left: '25%', animationDelay: '6s' }}>
        <div className="w-14 h-14 rounded-full bg-blue-500" />
      </div>
      <div className="floating-shape" style={{ bottom: '15%', right: '15%', animationDelay: '9s' }}>
        <div className="w-10 h-10 rounded-full bg-yellow-500" />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center relative z-10">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg" />
        </div>
        <h1 className="menu-title text-6xl font-black tracking-tight mb-2">
          LUDO
        </h1>
        <p className="text-white/60 text-sm font-medium">Pass & Play • Offline Ready</p>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-xs space-y-3 relative z-10">
        {hasSave && (
          <button
            onClick={onResume}
            className="btn-primary w-full py-4 px-6 text-white rounded-2xl font-bold text-lg relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume Game
            </span>
          </button>
        )}
        <button
          onClick={onPlay}
          className="btn-primary w-full py-4 px-6 text-white rounded-2xl font-bold text-lg relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <DiceIcon />
            New Game
          </span>
        </button>
        <button
          onClick={onSettings}
          className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <SettingsIcon />
            Settings
          </span>
        </button>
        <button
          onClick={onStats}
          className="w-full py-4 px-6 rounded-2xl font-bold text-lg text-white transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
          }}
        >
          <span className="flex items-center justify-center gap-2">
            <TrophyIcon />
            Statistics
          </span>
        </button>
      </div>

      <p className="mt-8 text-xs text-white/40 text-center relative z-10">
        2–6 players • One device • No internet needed
      </p>
    </div>
  );
};

export default Menu;
