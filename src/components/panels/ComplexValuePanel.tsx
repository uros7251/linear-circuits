import React, { useState, useEffect } from 'react';
import BasePanel from './BasePanel';
import styles from '../../styles/Panel.module.css';
import { complexToString, parseComplexInput } from '../../circuit/formatValue';

interface ComplexValuePanelProps {
  label: string;
  real: number;
  imag: number;
  unit: string;
  unitOptions: { value: string; label: string }[];
  onLabelChange: (label: string) => void;
  onValueChange: (re: number, im: number) => void;
  onUnitChange: (unit: string) => void;
}

const ComplexValuePanel: React.FC<ComplexValuePanelProps> = ({
  label, real, imag, unit, unitOptions, onLabelChange, onValueChange, onUnitChange,
}) => {
  const [inputStr, setInputStr] = useState(() => complexToString(real, imag));

  useEffect(() => {
    setInputStr(complexToString(real, imag));
  }, [real, imag]);

  const commit = () => {
    const parsed = parseComplexInput(inputStr);
    if (parsed) {
      onValueChange(parsed.re, parsed.im);
    } else {
      setInputStr(complexToString(real, imag));
    }
  };

  return (
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
          type="text"
          value={inputStr}
          onChange={e => setInputStr(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          className={styles.input}
          placeholder="e.g. 3+4j"
        />
      </div>
    </BasePanel>
  );
};

export default ComplexValuePanel;
