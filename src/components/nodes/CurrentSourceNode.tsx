import React from 'react';
import type { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import styles from '../../styles/CurrentSourceNode.module.css';
import type { CurrentSourceData } from '../../circuit/nodeDataTypes';
import { useCircuitContext } from '../../context/CircuitContext';
import { computeSourceColor } from './sourceColor';

const symbol = (
  <svg width={120} height={60} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 0,30 L 37,30 M 83,30 L 120,30" />
    <circle cx={60} cy={30} r={23} />
    {/* arrow pointing right → */}
    <path d="M 45,30 L 74,30 M 74,30 L 66,24 M 74,30 L 66,36" />
  </svg>
);

const CurrentSourceNode: React.FC<NodeProps<CurrentSourceData>> = (props) => {
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
      labelClassName={styles['current-source-label']}
      valueClassName={styles['current-source-value']}
      className={styles['current-source-node']}
      rotation={props.data.rotation}
      symbol={symbol}
      symbolStyle={glow ?? undefined}
      solverState={state}
      onRotate={onRotate}
    />
  );
};

export default CurrentSourceNode;
