import React from 'react';
import styles from '../../styles/Panel.module.css';

interface BasePanelProps {
  label: string;
  unit: string;
  unitOptions: { value: string; label: string }[];
  onLabelChange: (label: string) => void;
  onUnitChange: (unit: string) => void;
  children: React.ReactNode;
}

const BasePanel: React.FC<BasePanelProps> = ({ label, unit, unitOptions, onLabelChange, onUnitChange, children }) => (
  <>
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Label</span>
      <input
        type="text"
        value={label}
        onChange={e => onLabelChange(e.target.value)}
        className={styles.input}
      />
    </div>
    {children}
    <div className={styles.field}>
      <span className={styles.fieldLabel}>Unit</span>
      <select
        value={unit}
        onChange={e => onUnitChange(e.target.value)}
        className={styles.select}
      >
        {unitOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  </>
);

export default BasePanel;
