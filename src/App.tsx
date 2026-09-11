/**
 * Main App component - screen router and game lifecycle management.
 * Screens: menu, setup, game, gameover, settings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, PlayerColor, GameSettings, DEFAULT_SETTINGS, MODE_COLORS } from './config/constants';
import { GameState, createInitialState } from './core/engine';
import { getBoardLayout } from './core/paths';
import {
  loadSettings,
  saveSettings,
  loadGameState,
  hasSavedGame,
  savePlayerNames,
} from './services/storage';
import { initAudio, setMuted } from './services/audio';
import Menu from './components/Menu';
import Setup from './components/Setup';
import GameScreen from './components/GameScreen';
import GameOver from './components/GameOver';
import Settings from './components/Settings';

type Screen = 'menu' | 'setup' | 'game' | 'gameover' | 'settings';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [lastMode, setLastMode] = useState<GameMode>(4);
  const [lastNames, setLastNames] = useState<Record<PlayerColor, string>>({} as Record<PlayerColor, string>);

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Init audio on settings change
  useEffect(() => {
    initAudio(settings);
  }, [settings]);

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setMuted(!newSettings.soundEnabled);
  }, []);

  const handleStartGame = useCallback((mode: GameMode, names: Record<PlayerColor, string>) => {
    setLastMode(mode);
    setLastNames(names);
    savePlayerNames(names as Record<string, string>);

    const state = createInitialState(mode, names, settings);
    state.layout = getBoardLayout(mode);
    setGameState(state);
    setScreen('game');
  }, [settings]);

  const handleResume = useCallback(() => {
    const saved = loadGameState();
    if (saved) {
      saved.layout = getBoardLayout(saved.mode);
      setGameState(saved);
      setScreen('game');
    }
  }, []);

  const handleGameOver = useCallback((finalState: GameState) => {
    setGameState(finalState);
    setScreen('gameover');
  }, []);

  const handleRematch = useCallback(() => {
    const state = createInitialState(lastMode, lastNames, settings);
    state.layout = getBoardLayout(lastMode);
    setGameState(state);
    setScreen('game');
  }, [lastMode, lastNames, settings]);

  const handleNewGame = useCallback(() => {
    setScreen('setup');
  }, []);

  const handleQuit = useCallback(() => {
    setScreen('menu');
    setGameState(null);
  }, []);

  return (
    <div className="app-root">
      {screen === 'menu' && (
        <Menu
          onPlay={() => setScreen('setup')}
          onResume={handleResume}
          onSettings={() => setScreen('settings')}
          onStats={() => setScreen('settings')}
        />
      )}

      {screen === 'setup' && (
        <Setup
          onStart={handleStartGame}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && gameState && (
        <GameScreen
          initialState={gameState}
          onGameOver={handleGameOver}
          onQuit={handleQuit}
          onMenu={() => setScreen('menu')}
        />
      )}

      {screen === 'gameover' && gameState && gameState.winner && (
        <GameOver
          winner={gameState.winner}
          rankings={gameState.rankings}
          playerNames={Object.fromEntries(
            gameState.players.map(p => [p.color, p.name])
          ) as Record<PlayerColor, string>}
          onRematch={handleRematch}
          onNewGame={handleNewGame}
          onMenu={() => setScreen('menu')}
        />
      )}

      {screen === 'settings' && (
        <Settings
          settings={settings}
          onChange={handleSettingsChange}
          onBack={() => setScreen('menu')}
        />
      )}
    </div>
  );
}

export default App;
