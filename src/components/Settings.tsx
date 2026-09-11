/**
 * Settings screen - game rules, audio, display preferences.
 */

import React from 'react';
import { GameSettings, DEFAULT_SETTINGS } from '../config/constants';
import { loadStats, resetStats } from '../services/storage';

interface SettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
}

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
    <div className="min-h-screen flex flex-col p-6 bg-[#F6F4EF]">
      <button
        onClick={onBack}
        className="self-start mb-4 text-gray-500 hover:text-gray-700 text-lg"
      >
        ← Back
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>

      <div className="w-full max-w-sm space-y-4">
        {/* Sound */}
        <ToggleRow
          label="🔊 Sound Effects"
          checked={settings.soundEnabled}
          onChange={() => toggle('soundEnabled')}
        />

        {/* Animation speed */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <label className="text-sm font-medium text-gray-600 block mb-2">Animation Speed</label>
          <div className="flex gap-2">
            {(['slow', 'normal', 'fast'] as const).map(speed => (
              <button
                key={speed}
                onClick={() => onChange({ ...settings, animationSpeed: speed })}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  settings.animationSpeed === speed
                    ? 'bg-[#34A8E8] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {speed}
              </button>
            ))}
          </div>
        </div>

        {/* Rules */}
        <ToggleRow
          label="🎯 Auto-move if only one legal move"
          checked={settings.autoMoveSingle}
          onChange={() => toggle('autoMoveSingle')}
        />

        <ToggleRow
          label="⚡ Three 6s = forfeit turn"
          checked={settings.threeSixesAbort}
          onChange={() => toggle('threeSixesAbort')}
        />

        <ToggleRow
          label="🏆 Continue for all ranks"
          checked={settings.continueForRanks}
          onChange={() => toggle('continueForRanks')}
        />

        <ToggleRow
          label="📱 Pass device interstitial"
          checked={settings.passDevice}
          onChange={() => toggle('passDevice')}
        />

        {/* Stats */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Statistics</h3>
          <p className="text-gray-700">Games played: <strong>{stats.gamesPlayed}</strong></p>
          {Object.keys(stats.winsByColor).length > 0 && (
            <div className="mt-2 space-y-1">
              {Object.entries(stats.winsByColor).map(([color, wins]) => (
                <p key={color} className="text-sm text-gray-600 capitalize">
                  {color}: <strong>{wins as number}</strong> wins
                </p>
              ))}
            </div>
          )}
          <button
            onClick={handleResetStats}
            className="mt-3 text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Reset Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <span className="text-sm font-medium text-gray-700">{label}</span>
    <button
      onClick={onChange}
      className={`w-12 h-7 rounded-full transition-all relative ${checked ? 'bg-green-500' : 'bg-gray-300'}`}
    >
      <span
        className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`}
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  </div>
);

export default Settings;
