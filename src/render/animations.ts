/**
 * Animation system using Web Animations API.
 * All token movement = step-by-step hop along path array.
 * Respects prefers-reduced-motion and animation speed settings.
 */

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

const SPEED_MULTIPLIERS: Record<AnimationSpeed, number> = {
  slow: 1.5,
  normal: 1.0,
  fast: 0.6,
};

export function getSpeedMultiplier(speed: AnimationSpeed): number {
  return SPEED_MULTIPLIERS[speed];
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Hop token along a path of points (cell centers).
 * Each hop = arc lift + landing squash + per-step sound.
 */
export async function hopPath(
  tokenEl: SVGElement,
  points: { x: number; y: number; cellSize?: number }[],
  msPerHop: number = 150,
  speedMult: number = 1.0,
  onStep?: (stepIndex: number) => void
): Promise<void> {
  if (prefersReducedMotion() || points.length < 2) {
    // Instant move
    const last = points[points.length - 1];
    tokenEl.setAttribute('transform', `translate(${last.x}, ${last.y})`);
    return;
  }

  const dur = msPerHop * speedMult;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const cellSize = b.cellSize || 40;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - cellSize * 0.35;

    const anim = tokenEl.animate([
      { transform: `translate(${a.x}px, ${a.y}px) scale(1)` },
      { transform: `translate(${mx}px, ${my}px) scale(1.15)`, offset: 0.5 },
      { transform: `translate(${b.x}px, ${b.y}px) scale(0.92)`, offset: 0.85 },
      { transform: `translate(${b.x}px, ${b.y}px) scale(1)` }
    ], {
      duration: dur,
      easing: 'cubic-bezier(.3,.7,.4,1)',
      fill: 'forwards'
    });

    // Play step sound at landing (85% through animation)
    if (onStep) {
      setTimeout(() => onStep(i - 1), dur * 0.85);
    }

    await anim.finished;
  }
}

/**
 * Pop-in animation for token entering from base to start.
 */
export async function popIn(
  tokenEl: SVGElement,
  x: number,
  y: number,
  speedMult: number = 1.0
): Promise<void> {
  if (prefersReducedMotion()) {
    tokenEl.setAttribute('transform', `translate(${x}, ${y})`);
    return;
  }

  const dur = 300 * speedMult;
  const anim = tokenEl.animate([
    { transform: `translate(${x}px, ${y}px) scale(0)`, opacity: 0 },
    { transform: `translate(${x}px, ${y}px) scale(1.2)`, opacity: 1, offset: 0.6 },
    { transform: `translate(${x}px, ${y}px) scale(0.95)`, offset: 0.8 },
    { transform: `translate(${x}px, ${y}px) scale(1)` }
  ], {
    duration: dur,
    easing: 'cubic-bezier(.34,1.56,.64,1)',
    fill: 'forwards'
  });

  await anim.finished;
}

/**
 * Capture animation: victim spins and shrinks.
 */
export async function captureVictim(
  tokenEl: SVGElement,
  speedMult: number = 1.0
): Promise<void> {
  if (prefersReducedMotion()) return;

  const dur = 400 * speedMult;
  const anim = tokenEl.animate([
    { transform: 'scale(1) rotate(0deg)', opacity: 1 },
    { transform: 'scale(0.5) rotate(360deg)', opacity: 0 }
  ], {
    duration: dur,
    easing: 'cubic-bezier(.4,0,.2,1)',
    fill: 'forwards'
  });

  await anim.finished;
}

/**
 * Screen shake effect.
 */
export function screenShake(element: HTMLElement, speedMult: number = 1.0): void {
  if (prefersReducedMotion()) return;

  const dur = 150 * speedMult;
  element.animate([
    { transform: 'translate(0, 0)' },
    { transform: 'translate(-4px, 2px)' },
    { transform: 'translate(4px, -2px)' },
    { transform: 'translate(-2px, 4px)' },
    { transform: 'translate(0, 0)' }
  ], {
    duration: dur,
    easing: 'ease-out'
  });
}

/**
 * Particle burst effect.
 */
export function burst(x: number, y: number, color: string, n: number = 14): void {
  if (prefersReducedMotion()) return;

  for (let i = 0; i < n; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.background = color;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    document.body.appendChild(p);

    const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
    const distance = 40 + Math.random() * 60;

    const anim = p.animate([
      { transform: `translate(0, 0) scale(1)`, opacity: 1 },
      { transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px) scale(0)`, opacity: 0 }
    ], {
      duration: 500 + Math.random() * 250,
      easing: 'cubic-bezier(.2,.7,.3,1)'
    });

    anim.finished.then(() => p.remove());
  }
}

/**
 * Home celebration: wedge fill + confetti.
 */
export async function homeCelebration(
  tokenEl: SVGElement,
  x: number,
  y: number,
  color: string,
  speedMult: number = 1.0
): Promise<void> {
  if (prefersReducedMotion()) return;

  // Crown pop
  const dur = 400 * speedMult;
  const anim = tokenEl.animate([
    { transform: `translate(${x}px, ${y}px) scale(1)` },
    { transform: `translate(${x}px, ${y}px) scale(1.3)`, offset: 0.5 },
    { transform: `translate(${x}px, ${y}px) scale(1)` }
  ], {
    duration: dur,
    easing: 'cubic-bezier(.34,1.56,.64,1)',
    fill: 'forwards'
  });

  // Confetti burst
  burst(x, y, color, 20);

  await anim.finished;
}

/**
 * Dice glow pulse for rolling a 6.
 */
export function diceGlow(diceEl: HTMLElement, speedMult: number = 1.0): void {
  if (prefersReducedMotion()) return;

  const dur = 600 * speedMult;
  diceEl.animate([
    { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.7)' },
    { boxShadow: '0 0 20px 10px rgba(255, 215, 0, 0)' }
  ], {
    duration: dur,
    easing: 'ease-out'
  });
}

/**
 * Board cells stagger scale-in on game start.
 */
export async function boardEntrance(
  cellEls: SVGElement[],
  speedMult: number = 1.0
): Promise<void> {
  if (prefersReducedMotion()) return;

  const dur = 300 * speedMult;
  const stagger = 15 * speedMult;

  const promises = cellEls.map((el, i) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        const anim = el.animate([
          { transform: 'scale(0)', opacity: 0 },
          { transform: 'scale(1)', opacity: 1 }
        ], {
          duration: dur,
          easing: 'cubic-bezier(.34,1.56,.64,1)',
          fill: 'forwards'
        });
        anim.finished.then(() => resolve());
      }, i * stagger);
    });
  });

  await Promise.all(promises);
}

/**
 * Token drop into base with bounce.
 */
export async function tokenDrop(
  tokenEl: SVGElement,
  x: number,
  y: number,
  speedMult: number = 1.0
): Promise<void> {
  if (prefersReducedMotion()) {
    tokenEl.setAttribute('transform', `translate(${x}, ${y})`);
    return;
  }

  const dur = 400 * speedMult;
  const anim = tokenEl.animate([
    { transform: `translate(${x}px, ${y - 100}px) scale(0.8)`, opacity: 0 },
    { transform: `translate(${x}px, ${y}px) scale(1.1)`, opacity: 1, offset: 0.7 },
    { transform: `translate(${x}px, ${y}px) scale(0.95)`, offset: 0.85 },
    { transform: `translate(${x}px, ${y}px) scale(1)` }
  ], {
    duration: dur,
    easing: 'cubic-bezier(.34,1.56,.64,1)',
    fill: 'forwards'
  });

  await anim.finished;
}
