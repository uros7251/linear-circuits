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

const CurrentSourceLogo = () => (
  <svg width="30" height="30" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="23"/>
    <path d="M 15,30 L 44,30 M 44,30 L 36,24 M 44,30 L 36,36"/>
  </svg>
);

interface Props {
  onSave: () => void;
  onLoadClick: () => void;
  onClear: () => void;
}

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
);

const Toolbar: React.FC<Props> = ({ onSave, onLoadClick, onClear }) => (
  <div className={styles.toolbar}>
    <div className={styles.logo}>
      <CurrentSourceLogo />
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
    <a
      href="https://github.com/uros7251/linear-circuits"
      target="_blank"
      rel="noreferrer"
      className={styles.githubLink}
      title="View on GitHub"
    >
      <GitHubIcon />
    </a>
  </div>
);

export default Toolbar;
