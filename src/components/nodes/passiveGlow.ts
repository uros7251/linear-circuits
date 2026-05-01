import type React from 'react';
import { isComplex } from 'mathjs';
import type { Complex } from 'mathjs';
import { powerFromState } from '../../circuit/solverUtils';
import type { SolverState } from '../../circuit/nodeDataTypes';

const LOG_P_MIN = -6; // 1 μW — glow starts
const LOG_P_MAX = 3;  // 1 kW — max glow

export function computePassiveGlow(state: SolverState): React.CSSProperties | null {
  const S = powerFromState(state);
  const power = Math.abs(isComplex(S) ? (S as Complex).re : (S as number));
  if (power < 1e-6) return null;

  const t = Math.max(0, Math.min(1, (Math.log10(power) - LOG_P_MIN) / (LOG_P_MAX - LOG_P_MIN)));

  const g = Math.round(210 - t * 170);
  const a = (0.40 + t * 0.50).toFixed(2);
  const color = `rgba(255,${g},0,${a})`;

  const core = (3 + t * 9).toFixed(1);
  const bloomT = Math.max(0, (t - 0.4) / 0.6);
  const bloom = (bloomT * 35).toFixed(1);
  const bloomColor = `rgba(255,${g},0,${(bloomT * 0.45).toFixed(2)})`;

  const filter = bloomT === 0
    ? `drop-shadow(0 0 ${core}px ${color})`
    : `drop-shadow(0 0 ${core}px ${color}) drop-shadow(0 0 ${bloom}px ${bloomColor})`;

  return { filter };
}
