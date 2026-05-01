import React from 'react';
import BasePanel from './BasePanel';
import styles from '../../styles/Panel.module.css';

interface RealValuePanelProps {
  label: string;
  value: string;
  unit: string;
  unitOptions: { value: string; label: string }[];
  onLabelChange: (label: string) => void;
  onValueChange: (value: string) => void;
  onBlur: () => void;
  onUnitChange: (unit: string) => void;
}

const RealValuePanel: React.FC<RealValuePanelProps> = ({
  label, value, unit, unitOptions, onLabelChange, onValueChange, onBlur, onUnitChange
}) => (
  <BasePanel
    label={label}
    unit={unit}
    unitOptions={unitOptions}
    onLabelChange={onLabelChange}
    onUnitChange={onUnitChange}
  >
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Value</span>
      <input
        type="number"
        value={value}
        onChange={e => onValueChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={e => { if (e.key === 'Enter') onBlur(); }}
        className={styles.input}
      />
    </div>
  </BasePanel>
);

export default RealValuePanel;
