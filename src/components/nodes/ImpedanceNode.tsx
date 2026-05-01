import React from 'react';
import type { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import styles from '../../styles/ImpedanceNode.module.css';
import type { ImpedanceData } from '../../circuit/nodeDataTypes';
import { useCircuitContext } from '../../context/CircuitContext';
import { computePassiveGlow } from './passiveGlow';

const symbol = (
  <svg width={120} height={60} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 0,30 L 30,30" />
    <rect x={30} y={18} width={60} height={24} rx={2} />
    <path d="M 90,30 L 120,30" />
  </svg>
);

const ImpedanceNode: React.FC<NodeProps<ImpedanceData>> = (props) => {
  const { real, imag } = props.data;
  const value = `${real} ${imag >= 0 ? '+' : '-'} ${Math.abs(imag)}j`;

  const { solverResults, onRotate } = useCircuitContext();
  const state = solverResults.states.get(props.data.label);
  const glow = state ? computePassiveGlow(state) : null;

  return (
    <BaseNode
      {...props}
      label={props.data.label}
      value={value}
      unit={props.data.unit}
      labelClassName={styles['impedance-label']}
      valueClassName={styles['impedance-value']}
      className={styles['impedance-node']}
      rotation={props.data.rotation}
      symbol={symbol}
      nodeHeight={44}
      symbolStyle={glow ?? undefined}
      solverState={state}
      onRotate={onRotate}
    />
  );
};

export default ImpedanceNode;
