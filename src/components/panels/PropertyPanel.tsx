import React from 'react';
import type { Node } from 'reactflow';
import type { NodeData, NodeType } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';
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

const PropertyPanel: React.FC<Props> = ({ node, onUpdate, onClose }) => {
  const Panel = PANEL_MAP[node.type as NodeType];
  if (!Panel) return null;
  const title = COMPONENT_REGISTRY[node.type as NodeType]?.displayName ?? node.type;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
      <div className={styles.body}>
        <Panel node={node} onUpdate={onUpdate} />
      </div>
    </div>
  );
};

export default PropertyPanel;
