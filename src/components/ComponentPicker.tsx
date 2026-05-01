import React from 'react';
import styles from '../styles/ComponentPicker.module.css';
import { COMPONENT_REGISTRY, NODE_TYPES } from '../circuit/componentRegistry';
import type { NodeType } from '../circuit/nodeDataTypes';

interface Props {
  onAdd: (type: NodeType) => void;
}

const ComponentPicker: React.FC<Props> = ({ onAdd }) => (
  <div className={styles.container}>
    {NODE_TYPES.map(type => (
      <button key={type} onClick={() => onAdd(type)}>
        {COMPONENT_REGISTRY[type].displayName}
      </button>
    ))}
  </div>
);

export default ComponentPicker;
