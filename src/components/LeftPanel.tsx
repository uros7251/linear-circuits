import React from 'react';
import styles from '../styles/LeftPanel.module.css';
import { COMPONENT_REGISTRY, NODE_TYPES } from '../circuit/componentRegistry';
import type { NodeType } from '../circuit/nodeDataTypes';
import { EXAMPLE_CIRCUITS } from '../circuit/exampleCircuits';
import type { ExampleCircuit } from '../circuit/exampleCircuits';

interface Props {
  onAdd: (type: NodeType) => void;
  onLoadExample: (circuit: ExampleCircuit) => void;
}

const LeftPanel: React.FC<Props> = ({ onAdd, onLoadExample }) => (
  <div className={styles.panel}>
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
);

export default LeftPanel;
