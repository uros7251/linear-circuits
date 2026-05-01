import React from 'react';
import type { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import styles from '../../styles/VoltageSourceNode.module.css';
import type { VoltageSourceData } from '../../circuit/nodeDataTypes';
import { useCircuitContext } from '../../context/CircuitContext';
import { computeSourceColor } from './sourceColor';

const symbol = (
  <svg width={120} height={60} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
    <path d="M 0,30 L 37,30 M 83,30 L 120,30" />
    <circle cx={60} cy={30} r={23} />
    {/* left = +, right = − */}
    <line x1={46} y1={30} x2={54} y2={30} />
    <line x1={50} y1={26} x2={50} y2={34} />
    <line x1={66} y1={30} x2={74} y2={30} />
  </svg>
);

const VoltageSourceNode: React.FC<NodeProps<VoltageSourceData>> = (props) => {
  const { real, imag } = props.data;
  const value = imag === 0 ? `${real}` : `${real} ${imag >= 0 ? '+' : '−'} ${Math.abs(imag)}j`;

  const { solverResults, onRotate } = useCircuitContext();
  const state = solverResults.states.get(props.data.label);
  const glow = state ? computeSourceColor(state) : null;

  return (
    <BaseNode
      {...props}
      label={props.data.label}
      value={value}
      unit={props.data.unit}
      labelClassName={styles['voltage-source-label']}
      valueClassName={styles['voltage-source-value']}
      className={styles['voltage-source-node']}
      rotation={props.data.rotation}
      symbol={symbol}
      symbolStyle={glow ?? undefined}
      solverState={state}
      onRotate={onRotate}
    />
  );
};

export default VoltageSourceNode;
