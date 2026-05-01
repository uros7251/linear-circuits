import React, { useState } from 'react';
import { Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { isComplex, multiply } from 'mathjs';
import type { Complex, MathNumericType } from 'mathjs';
import styles from '../../styles/BaseNode.module.css';
import NodeHandle from './NodeHandle';
import { formatWithUnit } from '../../circuit/formatValue';
import type { SolverState } from '../../circuit/nodeDataTypes';

export const NODE_WIDTH = 120;
export const NODE_HEIGHT = 60;

const ROTATION_HANDLES = {
  0: [
    { id: 'left', position: Position.Left, style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
    { id: 'right', position: Position.Right, style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
  ],
  90: [
    { id: 'left', position: Position.Top, style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
    { id: 'right', position: Position.Bottom, style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
  ],
  180: [
    { id: 'left', position: Position.Right, style: { top: '50%', right: -5, transform: 'translateY(-50%)' } },
    { id: 'right', position: Position.Left, style: { top: '50%', left: -5, transform: 'translateY(-50%)' } },
  ],
  270: [
    { id: 'left', position: Position.Bottom, style: { bottom: -5, left: '50%', transform: 'translateX(-50%)' } },
    { id: 'right', position: Position.Top, style: { top: -5, left: '50%', transform: 'translateX(-50%)' } },
  ],
} as const;

interface BaseNodeProps extends NodeProps {
  label: string;
  value?: string | number;
  unit?: string;
  valueClassName?: string;
  labelClassName?: string;
  rotation?: number;
  className?: string;
  /** SVG symbol — when provided, replaces text content; label/value float outside. */
  symbol?: React.ReactNode;
  /** Trim the outer bounding box height (defaults to NODE_HEIGHT). SVG overflows visibly. */
  nodeHeight?: number;
  /** Extra content rendered inside the node box (e.g. polarity indicators). */
  children?: React.ReactNode;
  /** Style applied to a wrapper around the symbol SVG (e.g. glow filters). */
  symbolStyle?: React.CSSProperties;
  /** Class applied to the same symbol wrapper. */
  symbolClassName?: string;
  solverState?: SolverState;
  onRotate: (id: string) => void;
}

const BaseNode: React.FC<BaseNodeProps> = ({
  id,
  label,
  value,
  unit,
  valueClassName = '',
  labelClassName = '',
  rotation = 0,
  className = '',
  symbol,
  nodeHeight = NODE_HEIGHT,
  children,
  symbolStyle,
  symbolClassName,
  solverState,
  onRotate,
}) => {
  const [hovered, setHovered] = useState(false);
  const normalizedRotation = ((rotation % 360) + 360) % 360;
  const handles = ROTATION_HANDLES[normalizedRotation as 0 | 90 | 180 | 270] ?? ROTATION_HANDLES[0];
  const isHorizontal = normalizedRotation === 0 || normalizedRotation === 180;
  const outerWidth = isHorizontal ? NODE_WIDTH : nodeHeight;
  const outerHeight = isHorizontal ? nodeHeight : NODE_WIDTH;

  return (
    <div
      className={`${styles['base-node']} ${symbol ? styles['symbol-node'] : ''} ${symbol && !isHorizontal ? styles['symbol-node-vertical'] : ''} ${className}`}
      style={{ position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', width: outerWidth, height: outerHeight }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {handles.map(h => (
        <NodeHandle key={h.id} id={h.id} position={h.position} style={h.style} />
      ))}
      <div
        style={{
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) rotate(${normalizedRotation}deg)`,
          transformOrigin: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          ...(symbol ? symbolStyle : undefined),
        }}
        className={symbol ? symbolClassName : undefined}
      >
        {symbol ?? (
          <>
            <div className={labelClassName}>{label}</div>
            {value !== undefined && value !== null && (
              <div className={valueClassName}>{`${value} ${unit ?? ''}`}</div>
            )}
            {children}
          </>
        )}
      </div>

      <button
        className={styles['rotate-btn']}
        onClick={e => { e.stopPropagation(); onRotate(id); }}
        title="Rotate 90° counterclockwise"
        aria-label="Rotate node"
      >
        ⟲
      </button>

      {symbol && (
        <>
          <div className={styles['symbol-label']}>{label}</div>
          {value !== undefined && value !== null && (
            <div className={styles['symbol-value']}>{`${value} ${unit ?? ''}`}</div>
          )}
          {children}
        </>
      )}

      {hovered && solverState && (() => {
        const iRe = isComplex(solverState.current) ? (solverState.current as Complex).re : (solverState.current as number);
        const s: MathNumericType = (Math.sign(iRe) || 1) as MathNumericType;
        const dispI = s === 1 ? solverState.current : multiply(-1, solverState.current) as MathNumericType;
        const dispV = s === 1 ? solverState.voltage : multiply(-1, solverState.voltage) as MathNumericType;
        return (
          <div className={styles['solver-tooltip']}>
            <span>I = {formatWithUnit(dispI, 'A')}</span>
            <span>V = {formatWithUnit(dispV, 'V')}</span>
          </div>
        );
      })()}
    </div>
  );
};

export default React.memo(BaseNode);
