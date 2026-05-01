import React from 'react';
import type { NodeProps } from 'reactflow';
import BaseNode from './BaseNode';
import styles from '../../styles/ResistorNode.module.css';
import type { ResistorData } from '../../circuit/nodeDataTypes';
import { useCircuitContext } from '../../context/CircuitContext';
import { computePassiveGlow } from './passiveGlow';

const symbol = (
  <svg width={120} height={60} viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M 0,30 L 30,30 L 35,19 L 45,41 L 55,19 L 65,41 L 75,19 L 85,41 L 90,30 L 120,30" />
  </svg>
);

const ResistorNode: React.FC<NodeProps<ResistorData>> = (props) => {
  const { solverResults, onRotate } = useCircuitContext();
  const state = solverResults.states.get(props.data.label);
  const glow = state ? computePassiveGlow(state) : null;

  return (
    <BaseNode
      {...props}
      label={props.data.label}
      value={props.data.resistance}
      unit={props.data.unit}
      labelClassName={styles['resistor-label']}
      valueClassName={styles['resistor-value']}
      className={styles['resistor-node']}
      rotation={props.data.rotation}
      symbol={symbol}
      nodeHeight={44}
      symbolStyle={glow ?? undefined}
      solverState={state}
      onRotate={onRotate}
    />
  );
};

export default ResistorNode;
