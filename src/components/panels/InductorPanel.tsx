import React, { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import RealValuePanel from './RealValuePanel';
import type { InductorData } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';

interface Props {
  node: Node<InductorData>;
  onUpdate: (updates: Partial<InductorData>) => void;
}

const InductorPanel: React.FC<Props> = ({ node, onUpdate }) => {
  const [editValue, setEditValue] = useState(String(node.data.inductance));

  useEffect(() => {
    setEditValue(String(node.data.inductance));
  }, [node.id, node.data.inductance]);

  return (
    <RealValuePanel
      label={node.data.label}
      value={editValue}
      unit={node.data.unit}
      unitOptions={COMPONENT_REGISTRY.inductor.unitOptions}
      onLabelChange={label => onUpdate({ label })}
      onValueChange={setEditValue}
      onBlur={() => onUpdate({ inductance: editValue === '' ? 0 : Number(editValue) })}
      onUnitChange={unit => onUpdate({ unit })}
    />
  );
};

export default InductorPanel;
