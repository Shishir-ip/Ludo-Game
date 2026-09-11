# Ludo App v5 - Critical Bug Fixes & Regression Guards

## Summary

This update fixes three critical bugs that affected gameplay visibility and UX, plus adds regression guards to prevent future issues.

## Bug A: Captured Tokens Invisible After Return to Base ✅ FIXED

### Root Causes Identified & Fixed

1. **Base token stacking bug** (Board.tsx)
   - **Problem**: All tokens in base (pathPosition === -1) were grouped together by color, causing stack offsets to be applied
   - **Result**: Tokens overlapped in base slots, making some invisible
   - **Fix**: Base tokens now use FIXED slot positions based on `token.index` - no grouping, no stacking offsets
   - **Code**: Only group tokens with `pathPosition >= 0` (track/home-column)

2. **Capture animation left opacity:0** (animations.ts)
   - **Problem**: `captureVictim()` used `fill: 'forwards'` which left element at opacity:0 after animation
   - **Result**: Token remained invisible even after state update
   - **Fix**: Changed to `fill: 'none'` so animation doesn't persist final state
   - **Added**: New `returnToBase()` function that:
     - Cancels all lingering animations
     - Hard-resets opacity to 1
     - Resets transform to slot position
     - Plays pop-in animation (scale 0 → 1.12 → 1)

3. **Capture return pipeline** (GameScreen.tsx)
   - **Problem**: After capture, victim tokens weren't properly reset
   - **Fix**: Added complete return-to-base sequence:
     1. Play capture animation with `fill: 'none'`
     2. For each captured token, call `returnToBase()` with their base slot position
     3. Play pop SFX
     4. State updates trigger re-render with correct positions

### Mandatory Behavior Implemented

✅ **Fixed slots**: Token *i* ALWAYS occupies base slot *i* (no sharing)
✅ **No base stacking**: Base tokens never grouped or offset
✅ **Single token layer**: All tokens in one SVG layer (no re-parenting)
✅ **Capture → return pipeline**: Exact sequence with hard reset
✅ **Pop-in animation**: Scale 0 → 1.12 → 1 over 260ms
✅ **Pop SFX**: Plays when token returns to base

## Bug B: Dice Pod Overlaps Board ✅ FIXED

### Root Cause
- Pod positioned at 4%/96% of board wrapper, which placed it at board corners
- No reserved margin around board for pod to live in

### Solution

1. **Ring margin system** (CSS)
   - Added `padding: clamp(56px, 11vw, 88px)` to `.board-wrap`
   - Creates reserved gutter around board on all sides
   - Responsive: compresses to 56px on short viewports (<600px height)
   - Pod lives in this ring, never overlapping board

2. **Pod anchor positions** (GameScreen.tsx)
   - Updated anchors to 2%/98% (inside ring margin)
   - Red = top-left, Green = top-right, Yellow = bottom-right, Blue = bottom-left
   - Pod center stays ≥8px outside board rect
   - Pod center stays ≥8px inside viewport (honors safe-area insets)

3. **Overlap guard** (GameScreen.tsx)
   - Dev-mode assertion checks pod/board intersection
   - Runs on mount, resize, and orientation change
   - Logs warning if overlap detected
   - Helps catch future regressions

### Testing
- ✅ Pod never intersects board at any viewport size
- ✅ Pod tappable in all four corners
- ✅ Board not cropped
- ✅ Works in portrait and landscape

## Bug C: Stack Count Badges Inside Bases ✅ FIXED

### Root Cause
- Badge rendering logic included base positions (pathPosition === -1)
- When base tokens were incorrectly grouped, badges appeared

### Solution
- Badge rendering now **only** applies to `pathPosition >= 0`
- Base tokens excluded from badge logic entirely
- No badges, no offsets inside bases (by construction)

### Code Change
```typescript
// Only render badges for track/home-column cells (pathPosition >= 0)
// NO badges in bases
if (token.pathPosition >= 0) {
  const key = `${token.color}-${token.pathPosition}`;
  if (stackCount >= 2 && !seen.has(key)) {
    seen.add(key);
    badges.push({ x, y, count: stackCount, color: token.color });
  }
}
```

## Regression Guards Added

### 1. Dev Helper: `window.__ludo.teleport(tokenId, cellIndex)`
- Allows QA to force tokens to specific cells
- Useful for testing captures, stacking, home column
- Example: `__ludo.teleport('red-0', 25)` moves red token 0 to cell 25

### 2. Base Token Visibility Check
- Runs after every move (100ms delay)
- Verifies all base tokens have opacity ≥ 0.5
- Logs error if invisible token detected
- Catches animation/state sync issues

### 3. Dice Pod Overlap Guard
- Checks pod/board intersection on mount, resize, orientation change
- Logs warning if overlap detected
- Helps catch layout regressions

## Files Modified

**src/components/Board.tsx**
- Fixed base token positioning (no stacking/grouping)
- Fixed badge rendering (exclude base positions)
- Added comments explaining the logic

**src/components/GameScreen.tsx**
- Added capture return pipeline with `returnToBase()`
- Fixed dice pod anchor positions (2%/98%)
- Added `window.__ludo.teleport` dev helper
- Added base token visibility regression guard
- Added dice pod overlap guard

**src/render/animations.ts**
- Changed `captureVictim()` to use `fill: 'none'`
- Added new `returnToBase()` function with hard reset + pop-in

**src/index.css**
- Added ring margin to `.board-wrap` (clamp 56px-88px)
- Added media query for short viewports

## Acceptance Criteria Met

✅ **2P Red vs Yellow**: Captured token visible in own base slot after cut
✅ **Stacking**: 2/3/4 tokens on track show offsets + correct badge
✅ **Capture stack**: All victims visible in own slots afterwards
✅ **Viewports**: Pod never intersects board at any size (320×568 to desktop)
✅ **Turn cycle**: Pod glides smoothly, banner/chips/sounds unchanged
✅ **No base badges**: Badges only on track/home-column cells
✅ **Build passes**: `npm run build` succeeds
✅ **Dev tools**: `__ludo.teleport` works for QA testing

## Technical Details

### Base Token Positioning (Fixed)
```typescript
if (token.pathPosition === -1) {
  // Base tokens: use FIXED slot positions (token.index determines slot)
  // NO stacking, NO offsets - each token has its own printed slot
  const pos = getBaseTokenPos(token.color, token.index);
  x = pos.x; y = pos.y;
}
```

### Capture Return Pipeline
```typescript
// 1. Play capture animation (fill: 'none')
await captureVictim(victimEl, speedMult);

// 2. Return to base with hard reset
await returnToBase(victimEl, baseSlotPos, speedMult);

// 3. Play pop SFX
sfx.baseExit();
```

### returnToBase Implementation
```typescript
export async function returnToBase(tokenEl, slotCenter, speedMult) {
  // Cancel all lingering animations
  tokenEl.getAnimations().forEach(a => a.cancel());
  
  // Hard reset
  tokenEl.classList.remove('captured', 'dying');
  tokenEl.style.opacity = '1';
  tokenEl.setAttribute('transform', `translate(${slotCenter.x}, ${slotCenter.y})`);
  
  // Pop-in animation
  await tokenEl.animate([...], { duration: 260 * speedMult }).finished;
}
```

### Ring Margin System
```css
.board-wrap {
  padding: clamp(56px, 11vw, 88px);
}

@media (max-height: 600px) {
  .board-wrap {
    padding: 56px;
  }
}
```

## Testing Instructions

### Manual QA Steps

1. **Test capture visibility**
   ```javascript
   // In browser console:
   __ludo.teleport('red-0', 25);  // Move red token to cell 25
   __ludo.teleport('yellow-0', 25); // Move yellow token to same cell
   // Roll dice as red, capture yellow
   // Verify: yellow token visible in yellow base slot 0
   ```

2. **Test stacking**
   ```javascript
   __ludo.teleport('red-0', 10);
   __ludo.teleport('red-1', 10);
   __ludo.teleport('red-2', 10);
   // Verify: 3 tokens stacked with offsets, badge shows "3"
   ```

3. **Test viewports**
   - Resize to 320×568, 360×640, 390×844, 412×915
   - Rotate to landscape 640×360
   - Verify: pod never overlaps board, always tappable

4. **Check console for warnings**
   - Should see no "[ludo] Base token invisible" errors
   - Should see no "[ludo] Dice pod overlaps board" warnings

## Deployment

Ready to deploy to Vercel:
```bash
npm run build
vercel --prod
```

Hard-reload to bust SW cache:
- Chrome: Ctrl+Shift+R (Cmd+Shift+R on Mac)
- Or clear site data in DevTools

---

**All three bugs fixed with regression guards in place. No rule behavior changed.**
