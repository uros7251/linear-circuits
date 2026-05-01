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
      <span className={styles.label}>f =</span>
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
