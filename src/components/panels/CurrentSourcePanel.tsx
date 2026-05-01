import React from 'react';
import type { Node } from 'reactflow';
import ComplexValuePanel from './ComplexValuePanel';
import type { CurrentSourceData } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';

interface Props {
  node: Node<CurrentSourceData>;
  onUpdate: (updates: Partial<CurrentSourceData>) => void;
}

const CurrentSourcePanel: React.FC<Props> = ({ node, onUpdate }) => (
  <ComplexValuePanel
    label={node.data.label}
    real={node.data.real}
    imag={node.data.imag}
    unit={node.data.unit}
    unitOptions={COMPONENT_REGISTRY.currentsource.unitOptions}
    onLabelChange={label => onUpdate({ label })}
    onValueChange={(real, imag) => onUpdate({ real, imag })}
    onUnitChange={unit => onUpdate({ unit })}
  />
);

export default CurrentSourcePanel;
