/**
 * Dice component with roll animation and classic pip faces.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { DICE_ANIM_MS } from '../config/constants';
import { playRoll, playSix, haptic } from '../services/audio';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  rolling: boolean;
}

const PIP_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [75, 25], [25, 50], [75, 50], [25, 75], [75, 75]],
};

const Dice: React.FC<DiceProps> = ({ value, onRoll, disabled, rolling }) => {
  const [displayValue, setDisplayValue] = useState<number>(value || 1);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (rolling) {
      setAnimating(true);
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
    } else if (value) {
      setDisplayValue(value);
      if (value === 6) {
        playSix();
        haptic([30, 50, 30]);
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
    <button
      onClick={handleClick}
      disabled={disabled || rolling}
      className={`
        relative w-20 h-20 rounded-2xl border-2 transition-all duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        ${animating ? 'animate-bounce' : ''}
        bg-white border-gray-300 shadow-lg
      `}
      aria-label={`Dice showing ${displayValue}. ${disabled ? 'Disabled' : 'Tap to roll'}`}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {pips.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={10}
            fill="#2D2D2D"
            className={animating ? 'animate-pulse' : ''}
          />
        ))}
      </svg>
    </button>
  );
};

export default Dice;
