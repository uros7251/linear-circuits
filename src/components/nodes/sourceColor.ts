import type React from 'react';
import { isComplex } from 'mathjs';
import type { Complex } from 'mathjs';
import { powerFromState } from '../../circuit/solverUtils';
import type { SolverState } from '../../circuit/nodeDataTypes';

const LOG_P_MIN = -9; // 1 nW — fade starts here (alpha ≈ 0)
const LOG_P_MAX = 3;  // 1 kW — full color

export function computeSourceColor(state: SolverState): React.CSSProperties | null {
  const S = powerFromState(state);
  const P = isComplex(S) ? (S as Complex).re : (S as number);
  const absP = Math.abs(P);
  if (absP < 1e-12) return null;

  const t = Math.max(0, Math.min(1, (Math.log10(absP) - LOG_P_MIN) / (LOG_P_MAX - LOG_P_MIN)));
  const pct = Math.round(t * t * 100); // quadratic ease: 0% → 100% mix
  if (pct === 0) return null;

  // blend from neutral schematic color toward green/red
  const target = P < 0 ? 'rgb(0,210,80)' : 'rgb(220,50,50)';
  const color = `color-mix(in srgb, ${target} ${pct}%, var(--schematic-stroke))`;
  return { '--symbol-color': color } as React.CSSProperties;
}
