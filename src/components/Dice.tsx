/**
 * Dice component with 3D tumble animation, glow ring for 6, and press ripple.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playRoll, playSix, haptic } from '../services/audio';
import { diceGlow } from '../render/animations';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  rolling: boolean;
}

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
};

const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled, rolling }) => {
  const [displayValue, setDisplayValue] = useState<number>(value || 1);
  const [animating, setAnimating] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const diceRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (rolling) {
      setAnimating(true);
      setShowGlow(false);
      playRoll();
      haptic(50);
      let count = 0;
      const interval = setInterval(() => {
        setDisplayValue(Math.floor(Math.random() * 6) + 1);
        count++;
        if (count > 8) {
          clearInterval(interval);
          setAnimating(false);
        }
      }, 70);
      return () => clearInterval(interval);
    } else if (value !== null) {
      setDisplayValue(value);
      if (value === 6) {
        playSix();
        haptic([30, 50, 30]);
        setShowGlow(true);
        if (diceRef.current) {
          diceGlow(diceRef.current);
        }
        setTimeout(() => setShowGlow(false), 600);
      }
    }
  }, [rolling, value]);

  const handleClick = useCallback(() => {
    if (!disabled && !rolling) {
      onRoll();
    }
  }, [disabled, rolling, onRoll]);

  const pips = PIP_POSITIONS[displayValue] || PIP_POSITIONS[1];

  return (
    <div className="relative">
      <button
        ref={diceRef}
        onClick={handleClick}
        disabled={disabled || rolling}
        className={`
          dice relative overflow-hidden
          ${animating ? 'rolling' : ''}
          ${showGlow ? 'glow-6' : ''}
        `}
        aria-label={`Dice showing ${displayValue}. ${disabled ? 'Disabled' : 'Tap to roll'}`}
      >
        {/* Face gradient */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%)'
        }} />

        {/* Shine sweep */}
        <div className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity" style={{
          background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)'
        }} />

        {/* Pips */}
        <svg viewBox="0 0 100 100" className="relative w-full h-full z-10">
          <defs>
            <filter id="pipShadow">
              <feDropShadow dx="0" dy="1" stdDeviation="0.5" floodOpacity="0.3" />
            </filter>
          </defs>
          {pips.map(([cx, cy], i) => (
            <g key={i}>
              {/* Pip shadow */}
              <circle cx={cx} cy={cy + 1} r={9} fill="rgba(0,0,0,0.15)" />
              {/* Pip body */}
              <circle cx={cx} cy={cy} r={9} fill="#1f2937" filter="url(#pipShadow)" />
              {/* Pip highlight */}
              <circle cx={cx - 2} cy={cy - 2} r={3} fill="rgba(255,255,255,0.2)" />
            </g>
          ))}
        </svg>

        {/* Press ripple */}
        <div className="absolute inset-0 rounded-2xl bg-black/5 active:bg-black/10 transition-colors" />
      </button>

      {/* Glow ring for 6 */}
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
          boxShadow: '0 0 30px 10px rgba(255, 215, 0, 0.5)',
          animation: 'glowPulse 0.6s ease-out forwards'
        }} />
      )}
    </div>
  );
};

export default Dice;
