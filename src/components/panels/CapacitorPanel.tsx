import React, { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import RealValuePanel from './RealValuePanel';
import type { CapacitorData } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';

interface Props {
  node: Node<CapacitorData>;
  onUpdate: (updates: Partial<CapacitorData>) => void;
}

const CapacitorPanel: React.FC<Props> = ({ node, onUpdate }) => {
  const [editValue, setEditValue] = useState(String(node.data.capacitance));

  useEffect(() => {
    setEditValue(String(node.data.capacitance));
  }, [node.id, node.data.capacitance]);

  return (
    <RealValuePanel
      label={node.data.label}
      value={editValue}
      unit={node.data.unit}
      unitOptions={COMPONENT_REGISTRY.capacitor.unitOptions}
      onLabelChange={label => onUpdate({ label })}
      onValueChange={setEditValue}
      onBlur={() => onUpdate({ capacitance: editValue === '' ? 0 : Number(editValue) })}
      onUnitChange={unit => onUpdate({ unit })}
    />
  );
};

export default CapacitorPanel;
