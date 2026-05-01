import React from 'react';
import type { Node } from 'reactflow';
import ComplexValuePanel from './ComplexValuePanel';
import type { VoltageSourceData } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';

interface Props {
  node: Node<VoltageSourceData>;
  onUpdate: (updates: Partial<VoltageSourceData>) => void;
}

const VoltageSourcePanel: React.FC<Props> = ({ node, onUpdate }) => (
  <ComplexValuePanel
    label={node.data.label}
    real={node.data.real}
    imag={node.data.imag}
    unit={node.data.unit}
    unitOptions={COMPONENT_REGISTRY.voltagesource.unitOptions}
    onLabelChange={label => onUpdate({ label })}
    onValueChange={(real, imag) => onUpdate({ real, imag })}
    onUnitChange={unit => onUpdate({ unit })}
  />
);

export default VoltageSourcePanel;
