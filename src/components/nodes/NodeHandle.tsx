import React from 'react';
import { Handle, Position } from 'reactflow';
import styles from '../../styles/NodeHandle.module.css';

export interface NodeHandleProps {
  id: string;
  position: Position;
  type?: 'source' | 'target';
  style?: React.CSSProperties;
}

const NodeHandle: React.FC<NodeHandleProps> = ({ id, position, type = 'source', style }) => (
  <Handle
    type={type}
    position={position}
    id={id}
    className={styles.handle}
    style={{ position: 'absolute', ...style }}
  />
);

export default NodeHandle; 