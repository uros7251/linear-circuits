import React, { useState, useEffect } from 'react';
import { useCircuitContext } from '../context/CircuitContext';
import styles from '../styles/FrequencyControl.module.css';

const SLIDER_MAX = 100;

// Slider 0 → DC (0 Hz); slider 1–100 → log scale 0.001 Hz – 1 MHz (9 decades)
function sliderToFreq(value: number): number {
  if (value === 0) return 0;
  return Math.pow(10, ((value - 1) / (SLIDER_MAX - 1)) * 9 - 3);
}

function freqToSlider(freq: number): number {
  if (freq <= 0) return 0;
  return Math.round(1 + ((Math.log10(freq) + 3) / 9) * (SLIDER_MAX - 1));
}

function freqToDisplay(freq: number): string {
  return freq < 1e-9 ? '0' : String(parseFloat(freq.toPrecision(4)));
}

export default function FrequencyControl() {
  const { omega, setOmega } = useCircuitContext();
  const freq = omega / (2 * Math.PI);

  // Local input state so typing doesn't fight the slider
  const [inputValue, setInputValue] = useState(freqToDisplay(freq));

  // Keep input in sync when slider moves
  useEffect(() => {
    setInputValue(freqToDisplay(freq));
  }, [freq]);

  const applyFreq = (f: number) => {
    const clamped = Math.max(0, f);
    setOmega(clamped * 2 * Math.PI);
  };


  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFreq(sliderToFreq(Number(e.target.value)));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const commitInput = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      applyFreq(parsed);
    } else {
      setInputValue(freqToDisplay(freq)); // revert on invalid
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  };

  return (
    <div className={styles.container}>
      <svg className={styles.label} width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 0.0 7.0 C0.56 6.13 1.11 5.26 1.67 4.5 C2.22 3.74 2.78 3.11 3.33 2.67 C3.89 2.23 4.44 2.0 5.0 2.0 C5.56 2.0 6.11 2.23 6.67 2.67 C7.22 3.11 7.78 3.74 8.33 4.5 C8.89 5.26 9.44 6.13 10.0 7.0 C10.56 7.87 11.11 8.74 11.67 9.5 C12.22 10.26 12.78 10.89 13.33 11.33 C13.89 11.77 14.44 12.0 15.0 12.0 C15.56 12.0 16.11 11.77 16.67 11.33 C17.22 10.89 17.78 10.26 18.33 9.5 C18.89 8.74 19.44 7.87 20.0 7.0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      </svg>
      <input
        className={styles.slider}
        type="range"
        min={0}
        max={SLIDER_MAX}
        value={freqToSlider(freq)}
        onChange={handleSlider}
      />
      <div className={styles.inputGroup}>
        <input
          className={styles.input}
          type="number"
          min={0}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={commitInput}
          onKeyDown={handleKeyDown}
        />
        <span className={styles.unit}>Hz</span>
      </div>
    </div>
  );
}
