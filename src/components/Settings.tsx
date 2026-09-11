/**
 * Settings screen - gradient cards, springy toggles, segmented control.
 */

import React from 'react';
import { GameSettings } from '../config/constants';
import { loadStats, resetStats } from '../services/storage';

interface SettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
}

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

const Settings: React.FC<SettingsProps> = ({ settings, onChange, onBack }) => {
  const stats = loadStats();

  const toggle = (key: keyof GameSettings) => {
    const val = settings[key];
    if (typeof val === 'boolean') {
      onChange({ ...settings, [key]: !val });
    }
  };

  const handleResetStats = () => {
    if (confirm('Reset all statistics?')) {
      resetStats();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-6 screen-enter overflow-y-auto" style={{ maxHeight: '100dvh' }}>
      <button
        onClick={onBack}
        className="self-start mb-4 text-white/70 hover:text-white flex items-center gap-2 text-base font-medium transition-colors"
      >
        <BackIcon /> Back
      </button>

      <h2 className="text-3xl font-black text-white mb-6">Settings</h2>

      <div className="w-full max-w-sm space-y-4">
        {/* Sound */}
        <ToggleRow
          label="🔊 Sound Effects"
          checked={settings.soundEnabled}
          onChange={() => toggle('soundEnabled')}
        />

        {/* Animation speed - segmented control */}
        <div className="settings-card rounded-2xl p-4">
          <label className="text-sm font-bold text-white/80 block mb-3">Animation Speed</label>
          <div className="segmented-control flex gap-1 p-1 rounded-xl relative">
            {(['slow', 'normal', 'fast'] as const).map(speed => (
              <button
                key={speed}
                onClick={() => onChange({ ...settings, animationSpeed: speed })}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all relative z-10 ${
                  settings.animationSpeed === speed ? 'text-white' : 'text-white/60 hover:text-white/80'
                }`}
              >
                {settings.animationSpeed === speed && (
                  <div className="segment-thumb absolute inset-0 rounded-lg" />
                )}
                <span className="relative z-10 capitalize">{speed}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <ToggleRow
          label="🎯 Auto-move single option"
          checked={settings.autoMoveSingle}
          onChange={() => toggle('autoMoveSingle')}
        />

        <ToggleRow
          label="⚡ Three 6s = forfeit"
          checked={settings.threeSixesAbort}
          onChange={() => toggle('threeSixesAbort')}
        />

        <ToggleRow
          label="🏆 Continue for all ranks"
          checked={settings.continueForRanks}
          onChange={() => toggle('continueForRanks')}
        />

        <ToggleRow
          label="📱 Pass device prompt"
          checked={settings.passDevice}
          onChange={() => toggle('passDevice')}
        />

        {/* Stats */}
        <div className="settings-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white/80 mb-3">Statistics</h3>
          <p className="text-white font-bold text-lg mb-2">
            Games played: <span className="text-blue-400">{stats.gamesPlayed}</span>
          </p>
          {Object.keys(stats.winsByColor).length > 0 && (
            <div className="mt-3 space-y-2">
              {Object.entries(stats.winsByColor).map(([color, wins]) => (
                <div key={color} className="flex items-center justify-between">
                  <span className="text-sm text-white/70 capitalize flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color === 'yellow' ? '#EAB308' : color === 'red' ? '#E23A3A' : color === 'green' ? '#16A34A' : color === 'blue' ? '#2563EB' : '#8B5CF6' }} />
                    {color}
                  </span>
                  <span className="text-sm font-bold text-white">{wins as number} wins</span>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={handleResetStats}
            className="mt-4 text-sm text-red-400 hover:text-red-300 font-bold transition-colors"
          >
            Reset Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <div className="settings-card flex items-center justify-between rounded-2xl p-4">
    <span className="text-sm font-bold text-white/90">{label}</span>
    <button
      onClick={onChange}
      className={`toggle-track w-14 h-8 rounded-full relative transition-colors ${checked ? 'bg-green-500' : 'bg-white/20'}`}
    >
      <span
        className={`toggle-thumb absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg ${checked ? 'left-7' : 'left-1'}`}
      />
    </button>
  </div>
);

export default Settings;
