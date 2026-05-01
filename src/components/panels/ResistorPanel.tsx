import React, { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import RealValuePanel from './RealValuePanel';
import type { ResistorData } from '../../circuit/nodeDataTypes';
import { COMPONENT_REGISTRY } from '../../circuit/componentRegistry';

interface Props {
  node: Node<ResistorData>;
  onUpdate: (updates: Partial<ResistorData>) => void;
}

const ResistorPanel: React.FC<Props> = ({ node, onUpdate }) => {
  const [editValue, setEditValue] = useState(String(node.data.resistance));

  useEffect(() => {
    setEditValue(String(node.data.resistance));
  }, [node.id, node.data.resistance]);

  return (
    <RealValuePanel
      label={node.data.label}
      value={editValue}
      unit={node.data.unit}
      unitOptions={COMPONENT_REGISTRY.resistor.unitOptions}
      onLabelChange={label => onUpdate({ label })}
      onValueChange={setEditValue}
      onBlur={() => onUpdate({ resistance: editValue === '' ? 0 : Number(editValue) })}
      onUnitChange={unit => onUpdate({ unit })}
    />
  );
};

export default ResistorPanel;
