import React from 'react';
import type { NodeProps } from 'reactflow';
import { abs, isComplex } from 'mathjs';
import type { Complex, MathNumericType } from 'mathjs';
import BaseNode from './BaseNode';
import styles from '../../styles/InductorNode.module.css';
import type { InductorData } from '../../circuit/nodeDataTypes';
import { useCircuitContext } from '../../context/CircuitContext';

const LOG_I_MIN = -3; // 1 mA — field starts appearing
const LOG_I_MAX = 1;  // 10 A  — full intensity
const FIELD_COLOR = '#8b5cf6'; // violet — magnetic field
// One short arrow inside each arc loop.
// Arcs are semicircles r=10 centered at (40,30),(60,30),(80,30), peak y=20.
// y=25 is halfway between peak and base — comfortably inside each loop.
const ARC_CENTERS = [40, 60, 80];
const Y = 25;

function fieldArrows(current: MathNumericType, ac: boolean): React.ReactNode | null {
  const iMag = abs(current) as number;
  if (iMag < 1e-3) return null;

  const t = Math.max(0, Math.min(1, (Math.log10(iMag) - LOG_I_MIN) / (LOG_I_MAX - LOG_I_MIN)));
  const opacity = t * t;
  if (opacity < 0.01) return null;

  const iReal = isComplex(current) ? (current as Complex).re : (current as number);
  const right = iReal >= 0;

  return (
    <g opacity={opacity} stroke={FIELD_COLOR} fill={FIELD_COLOR} strokeWidth={1.2} strokeLinecap="round">
      {ARC_CENTERS.map(cx => {
        const x1 = cx - 6, x2 = cx + 6;
        return (
          <g key={cx}>
            <line x1={x1} y1={Y} x2={x2} y2={Y} />
            {(right || ac) && <polygon points={`${x2 - 3},${Y - 2} ${x2},${Y} ${x2 - 3},${Y + 2}`} />}
            {(!right || ac) && <polygon points={`${x1 + 3},${Y - 2} ${x1},${Y} ${x1 + 3},${Y + 2}`} />}
          </g>
        );
      })}
    </g>
  );
}

const InductorNode: React.FC<NodeProps<InductorData>> = (props) => {
  const { solverResults, omega, onRotate } = useCircuitContext();
  const state = solverResults.states.get(props.data.label);
  const arrows = state ? fieldArrows(state.current, omega !== 0) : null;

  const symbol = (
    <svg width={120} height={60} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M 0,30 L 30,30 A 10,10 0 0 0 50,30 A 10,10 0 0 0 70,30 A 10,10 0 0 0 90,30 L 120,30" />
      {arrows}
    </svg>
  );

  return (
    <BaseNode
      {...props}
      label={props.data.label}
      value={props.data.inductance}
      unit={props.data.unit}
      labelClassName={styles['inductor-label']}
      valueClassName={styles['inductor-value']}
      className={styles['inductor-node']}
      rotation={props.data.rotation}
      symbol={symbol}
      nodeHeight={44}
      solverState={state}
      onRotate={onRotate}
    />
  );
};

export default InductorNode;
