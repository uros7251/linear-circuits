import React from 'react';
import type { Node } from 'reactflow';
import ComplexValuePanel from './ComplexValuePanel';
import type { ImpedanceData } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';

interface Props {
  node: Node<ImpedanceData>;
  onUpdate: (updates: Partial<ImpedanceData>) => void;
}

const ImpedancePanel: React.FC<Props> = ({ node, onUpdate }) => (
  <ComplexValuePanel
    label={node.data.label}
    real={node.data.real}
    imag={node.data.imag}
    unit={node.data.unit}
    unitOptions={COMPONENT_REGISTRY.impedance.unitOptions}
    onLabelChange={label => onUpdate({ label })}
    onValueChange={(real, imag) => onUpdate({ real, imag })}
    onUnitChange={unit => onUpdate({ unit })}
  />
);

export default ImpedancePanel;
