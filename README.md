# 🎲 Ludo Offline - Pass & Play Board Game

A complete, client-side Ludo board game web app with hotseat multiplayer, offline PWA support, and vibrant visual design.

![Ludo Board](https://img.shields.io/badge/Players-2--6-blue) ![Offline](https://img.shields.io/badge/Offline-Ready-green) ![PWA](https://img.shields.io/badge/PWA-Installable-purple)

## ✨ Features

### 🎮 Game Modes
- **2P, 3P, 4P, 6P** hotseat modes (pass & play on one device)
- Classic Ludo rules with configurable options
- 4 tokens per player, first to home all 4 wins

### 🎨 Visual Design
- **Saturated vibrant colors** matching reference board image
- **3D tokens** with radial gradients, specular highlights, and shadows
- **Rich gradient backgrounds** with floating glow blobs and vignette
- **Animated dice** with 3D tumble, glow ring for 6, and press ripple
- **Golden safe stars** with soft glow effects
- **Colored entry arrows** with pulse animation
- **Gradient turn banner** with spring animation
- **Progress chips** with active player glow

### 🎬 Animation System
- **Hop-by-hop token movement** using Web Animations API
- **Arc lift + landing squash** for realistic motion
- **Capture effects**: spin-shrink + particle burst + screen shake
- **Home celebration**: confetti burst + crown pop
- **Board entrance**: staggered cell scale-in
- **Token drop**: bounce into base
- **Respects `prefers-reduced-motion`**
- **Configurable speed**: slow/normal/fast multiplier

### 📱 Mobile-First Design
- **No scrolling on game screen** - dice always visible and tappable
- **CSS Grid layout**: `auto 1fr auto` with safe-area padding
- **Board scales via viewBox** - never cropped
- **Dice dock**: 72px tap target, z-index above board
- **Works on all viewports**: 320×568, 360×640, 390×844, landscape
- **Touch-optimized**: no tap highlights, proper touch-action

### 🔊 Audio & Haptics
- **WebAudio synthesized SFX**: roll, hop, capture, home, win
- **Haptic feedback** on roll, capture, home
- **Master mute toggle** persisted in settings

### 💾 Persistence
- **localStorage**: settings, player names, win stats, game state
- **Resume after refresh**: exact game state restored
- **Offline PWA**: fully playable after first visit

### ⚙️ Configurable Rules
- Auto-move if single legal move (default OFF)
- Three consecutive 6s = forfeit turn (default ON)
- Continue for all ranks (default OFF)
- Pass device interstitial (default OFF)
- Animation speed: slow/normal/fast

## 🎯 Game Rules

### Classic Ludo Rules
- **Roll 6** to move token from base to start
- **Extra turn** on: rolling 6, capturing, homing a token
- **Three 6s** = turn ends immediately (configurable)
- **Capture**: landing on opponent token sends it back to base
- **Safe cells**: stars + all start cells (no capture)
- **Home column**: owner only, exact roll required to finish
- **Win**: first to home all 4 tokens

### Board Layout
- **Classic (2P/3P/4P)**: 15×15 grid, 52-cell loop + 6-cell home column
- **Hex (6P)**: 72-cell ring + 5-cell home column
- **Per-token path**: loop → column → center (58 or 78 slots)

## 🚀 Quick Start

### Local Development
```bash
# Any static server works (ES modules require HTTP)
npx serve
# or
python3 -m http.server
# or
vercel dev
```

### Deploy to Vercel
1. Push repo to GitHub
2. Vercel → Import Repo
3. Framework Preset: **Other**
4. Build Command: **empty**
5. Output Directory: **root**
6. Deploy

### Install as PWA
1. Visit the deployed URL
2. Browser will prompt "Add to Home Screen"
3. Game works fully offline after first visit

## 🏗️ Architecture

```
ludo-offline/
├── src/
│   ├── components/       # React UI components
│   │   ├── Board.tsx     # SVG board renderer with 3D tokens
│   │   ├── Dice.tsx      # Animated dice with tumble effect
│   │   ├── GameScreen.tsx # Main game with mobile layout
│   │   ├── Menu.tsx      # Menu with floating shapes
│   │   ├── Setup.tsx     # Player setup with segmented control
│   │   ├── Settings.tsx  # Settings with springy toggles
│   │   └── GameOver.tsx  # Victory screen with confetti
│   ├── core/
│   │   ├── engine.ts     # Pure game rules (no DOM)
│   │   └── paths.ts      # Board path definitions
│   ├── render/
│   │   └── animations.ts # Web Animations API system
│   ├── services/
│   │   ├── audio.ts      # WebAudio SFX
│   │   └── storage.ts    # localStorage wrapper
│   └── config/
│       └── constants.ts  # Colors, settings, types
├── public/
│   ├── sw.js             # Service worker (cache-first)
│   ├── manifest.webmanifest # PWA manifest
│   └── favicon.svg       # App icon
└── vercel.json           # Static deployment config
```

### Key Design Decisions

**Pure Engine**: `engine.ts` has zero DOM dependencies. All game logic is testable in Node.js.

**Data-Driven Board**: Board definitions are pure config objects. The renderer consumes layout data, never touches coordinates directly.

**Animation System**: Uses Web Animations API for 60fps performance. All animations respect `prefers-reduced-motion` and speed settings.

**Mobile-First Layout**: CSS Grid with `auto 1fr auto` ensures dice dock is always visible. Board scales via `viewBox` without cropping.

**Saturated Visuals**: Rich gradients, 3D tokens, and vibrant colors create an engaging, modern aesthetic.

## 🎨 Visual Overhaul Highlights

### Before → After
- **Bases**: Pale pastels → Saturated quadrants with white inner panels
- **Tokens**: Flat circles → 3D pins with radial gradients and specular highlights
- **Background**: Flat white → Deep navy→indigo gradient with floating glow blobs
- **Dice**: Simple → 3D tumble animation with glow ring for 6
- **Stars**: Gray → Golden with soft glow filter
- **Buttons**: Plain → Gradient fills with shine sweep and hover lift
- **Modals**: Basic → Backdrop blur with spring scale-in

### Animation Details
- **Token hop**: 150ms per cell, arc lift (35% cell height), landing squash (0.92→1.0)
- **Capture**: Victim spin-shrinks + 14-particle burst + 150ms screen shake
- **Home**: Confetti burst (20 particles) + crown pop animation
- **Board entrance**: Cells stagger scale-in (15ms apart)
- **Turn change**: Banner slides in with spring easing

## 📊 Statistics

Track your wins across all colors:
- Games played counter
- Wins by color breakdown
- Persistent across sessions
- Reset option in settings

## 🧪 Testing

```bash
npm test
```

Tests cover:
- 6-to-enter rule
- Extra turn matrix (6/capture/home)
- Three-sixes abort
- Capture legality (star/start immunity)
- Home column privacy + exact-finish
- Turn-order skipping (2P/3P/6P)
- Path invariants for both boards

## 🌐 Browser Support

- ✅ Chrome/Edge 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Mobile Chrome/Safari
- ✅ Works offline as PWA

## 📝 License

MIT License - feel free to use, modify, and distribute.

## 🙏 Credits

Built with React, TypeScript, Tailwind CSS, and Web Animations API.

---

**Made with ❤️ for offline board game enthusiasts**
