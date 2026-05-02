import React, { useState } from 'react';
import styles from '../styles/LeftPanel.module.css';
import { COMPONENT_REGISTRY, NODE_TYPES } from '../circuit/componentRegistry';
import type { NodeType } from '../circuit/nodeDataTypes';
import { EXAMPLE_CIRCUITS } from '../circuit/exampleCircuits';
import type { ExampleCircuit } from '../circuit/exampleCircuits';

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="8" height="12" viewBox="0 0 8 12" fill="none"
    style={{ transform: open ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}
  >
    <path d="M6 1L1 6l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Props {
  onAdd: (type: NodeType) => void;
  onLoadExample: (circuit: ExampleCircuit) => void;
}

const LeftPanel: React.FC<Props> = ({ onAdd, onLoadExample }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className={styles.wrapper}>
      <div className={open ? styles.panel : `${styles.panel} ${styles.panelCollapsed}`}>
        <div className={styles.panelContent}>
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Components</div>
            {NODE_TYPES.map(type => (
              <button key={type} className={styles.componentBtn} onClick={() => onAdd(type)}>
                {COMPONENT_REGISTRY[type].displayName}
              </button>
            ))}
          </div>
          <div className={styles.divider} />
          <div className={styles.section}>
            <div className={styles.sectionLabel}>Circuits</div>
            {EXAMPLE_CIRCUITS.map(circuit => (
              <button key={circuit.name} className={styles.componentBtn} onClick={() => onLoadExample(circuit)}>
                {circuit.name}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button
        className={styles.toggleBtn}
        onClick={() => setOpen(o => !o)}
        title={open ? 'Collapse panel' : 'Expand panel'}
      >
        <ChevronIcon open={open} />
      </button>
    </div>
  );
};

export default LeftPanel;
