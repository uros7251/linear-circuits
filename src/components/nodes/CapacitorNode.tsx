import React from 'react';
import type { NodeProps } from 'reactflow';
import { abs, isComplex } from 'mathjs';
import type { Complex, MathNumericType } from 'mathjs';
import BaseNode from './BaseNode';
import styles from '../../styles/CapacitorNode.module.css';
import type { CapacitorData } from '../../circuit/nodeDataTypes';
import { useCircuitContext } from '../../context/CircuitContext';

const LOG_V_MIN = -1; // 100 mV — field starts appearing
const LOG_V_MAX = 2;  // 100 V  — full intensity
const ARROW_COLOR = '#3b82f6';
const ARROW_Y = [19, 30, 41]; // three evenly-spaced field lines

function fieldArrows(voltage: MathNumericType, ac: boolean): React.ReactNode | null {
  const vMag = abs(voltage) as number;
  if (vMag < 0.1) return null;

  const t = Math.max(0, Math.min(1, (Math.log10(vMag) - LOG_V_MIN) / (LOG_V_MAX - LOG_V_MIN)));
  const opacity = t * t;
  if (opacity < 0.01) return null;

  const vReal = isComplex(voltage) ? (voltage as Complex).re : (voltage as number);
  const right = vReal >= 0;

  return (
    <g opacity={opacity} stroke={ARROW_COLOR} fill={ARROW_COLOR} strokeWidth={1.2} strokeLinecap="round">
      {ARROW_Y.map(y => (
        <g key={y}>
          <line x1={54} y1={y} x2={66} y2={y} />
          {(right || ac) && <polygon points={`62,${y - 2.5} 66,${y} 62,${y + 2.5}`} />}
          {(!right || ac) && <polygon points={`58,${y - 2.5} 54,${y} 58,${y + 2.5}`} />}
        </g>
      ))}
    </g>
  );
}

const CapacitorNode: React.FC<NodeProps<CapacitorData>> = (props) => {
  const { solverResults, omega, onRotate } = useCircuitContext();
  const state = solverResults.states.get(props.data.label);
  const arrows = state ? fieldArrows(state.voltage, omega !== 0) : null;

  const symbol = (
    <svg width={120} height={60} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M 0,30 L 50,30 M 50,12 L 50,48 M 70,12 L 70,48 M 70,30 L 120,30" />
      {arrows}
    </svg>
  );

  return (
    <BaseNode
      {...props}
      label={props.data.label}
      value={props.data.capacitance}
      unit={props.data.unit}
      labelClassName={styles['capacitor-label']}
      valueClassName={styles['capacitor-value']}
      className={styles['capacitor-node']}
      rotation={props.data.rotation}
      symbol={symbol}
      solverState={state}
      onRotate={onRotate}
    />
  );
};

export default CapacitorNode;
