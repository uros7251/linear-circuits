import React from 'react';
import styles from '../styles/Toolbar.module.css';

const SaveIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 1h8.5L13 3.5V13a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm3 0v4h5V1H5zm-.5 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="currentColor"/>
  </svg>
);

const OpenIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.58 0 1.123.232 1.535.645L7.5 3h5A1.5 1.5 0 0 1 14 4.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 11.5v-8z" fill="currentColor"/>
  </svg>
);

const ClearIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 1h5a1 1 0 0 1 1 1v1h3v1.5H1V3h3V2a1 1 0 0 1 1-1zM2.5 5.5l1 8h8l1-8H2.5zm2 2h1v4h-1v-4zm3 0h1v4H7.5v-4z" fill="currentColor"/>
  </svg>
);

interface Props {
  onSave: () => void;
  onLoadClick: () => void;
  onClear: () => void;
}

const Toolbar: React.FC<Props> = ({ onSave, onLoadClick, onClear }) => (
  <div className={styles.toolbar}>
    <div className={styles.logo}>
      <span className={styles.logoIcon}>⚡</span>
      Circuits
    </div>
    <div className={styles.divider} />
    <button className={styles.btn} onClick={onLoadClick}>
      <span className={styles.btnIcon}><OpenIcon /></span>
      Open
    </button>
    <button className={styles.btn} onClick={onSave}>
      <span className={styles.btnIcon}><SaveIcon /></span>
      Save
    </button>
    <button className={styles.btn} onClick={onClear}>
      <span className={styles.btnIcon}><ClearIcon /></span>
      Clear
    </button>
    <div className={styles.spacer} />
  </div>
);

export default Toolbar;
