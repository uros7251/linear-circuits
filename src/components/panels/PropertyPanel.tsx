import React from 'react';
import type { Node } from 'reactflow';
import { isComplex, multiply } from 'mathjs';
import type { Complex, MathNumericType } from 'mathjs';
import type { NodeData, NodeType, SolverState } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';
import { formatWithUnit } from '../../circuit/formatValue';
import ResistorPanel from './ResistorPanel';
import InductorPanel from './InductorPanel';
import CapacitorPanel from './CapacitorPanel';
import ImpedancePanel from './ImpedancePanel';
import CurrentSourcePanel from './CurrentSourcePanel';
import VoltageSourcePanel from './VoltageSourcePanel';
import styles from '../../styles/Panel.module.css';

interface Props {
  node: Node<NodeData>;
  onUpdate: (updates: Partial<NodeData>) => void;
  onClose: () => void;
  onDelete: () => void;
  solverState?: SolverState;
}

// Each panel narrows its own types internally; the registry holds the widest compatible signature.
type AnyPanel = React.FC<{ node: Node<any>; onUpdate: (updates: Partial<any>) => void }>;
const PANEL_MAP: Record<NodeType, AnyPanel> = {
  resistor: ResistorPanel,
  inductor: InductorPanel,
  capacitor: CapacitorPanel,
  impedance: ImpedancePanel,
  currentsource: CurrentSourcePanel,
  voltagesource: VoltageSourcePanel,
};

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3h11M4 3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1M5 6v4M8 6v4M2 3l.7 8a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9L11 3H2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PropertyPanel: React.FC<Props> = ({ node, onUpdate, onClose, onDelete, solverState }) => {
  const Panel = PANEL_MAP[node.type as NodeType];
  if (!Panel) return null;
  const title = COMPONENT_REGISTRY[node.type as NodeType]?.displayName ?? node.type;

  let dispI: MathNumericType | undefined;
  let dispV: MathNumericType | undefined;
  if (solverState) {
    const iRe = isComplex(solverState.current) ? (solverState.current as Complex).re : (solverState.current as number);
    const s = (Math.sign(iRe) || 1) as MathNumericType;
    dispI = s === 1 ? solverState.current : multiply(-1, solverState.current) as MathNumericType;
    dispV = s === 1 ? solverState.voltage : multiply(-1, solverState.voltage) as MathNumericType;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.headerActions}>
          <button className={styles.deleteBtn} onClick={onDelete} aria-label="Delete component">
            <TrashIcon />
          </button>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <Panel node={node} onUpdate={onUpdate} />
        {dispI !== undefined && dispV !== undefined && (
          <div className={styles.solverState}>
            <div className={styles.solverStateRow}>
              <span className={styles.fieldLabel}>Current</span>
              <span className={styles.solverStateValue}>{formatWithUnit(dispI, 'A')}</span>
            </div>
            <div className={styles.solverStateRow}>
              <span className={styles.fieldLabel}>Voltage</span>
              <span className={styles.solverStateValue}>{formatWithUnit(dispV, 'V')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyPanel;
