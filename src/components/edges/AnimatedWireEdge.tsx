import { useRef, useState, useEffect } from 'react';
import type { EdgeProps } from 'reactflow';
import { getSmoothStepPath } from 'reactflow';
import { abs } from 'mathjs';
import { useCircuitContext } from '../../context/CircuitContext';

const MIN_CURRENT = 1e-9; // 1 nA (= 1000 pA) — below this no animation
// Logarithmic speed scale: pA → barely moving, TA → super fast
// Each 3 decades (1000×) adds a constant speed increment
const LOG_MIN = -12; // log10(pA)
const LOG_MAX = 6;   // log10(MA) — cliff; anything above gets max speed
const SPEED_MIN = 2;   // px/s at pA
const SPEED_MAX = 400; // px/s at TA
// fixed px gap between dots so density stays constant per unit length
const DOT_SPACING = 30;

export default function AnimatedWireEdge({
  id,
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  selected,
}: EdgeProps) {
  const { solverResults, omega } = useCircuitContext();
  const current = solverResults.edgeCurrents.get(id);

  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 0,
    offset: 10,
  });

  const pathRef = useRef<SVGPathElement>(null);
  const [pathLength, setPathLength] = useState(150);

  useEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [edgePath]);

  const pathId = `edge-path-${id}`;
  const magnitude = current !== undefined ? (abs(current) as number) : 0;
  const isAnimated = magnitude > MIN_CURRENT;

  // Dot count scales with path length so density is constant
  const nDots = isAnimated ? Math.max(1, Math.round(pathLength / DOT_SPACING)) : 0;

  let dur = 1;
  let keyPoints = '0;1';
  let keyTimes = '0;1';

  if (isAnimated) {
    const t = Math.max(0, Math.min(1, (Math.log10(magnitude) - LOG_MIN) / (LOG_MAX - LOG_MIN)));
    const speed = SPEED_MIN + t * (SPEED_MAX - SPEED_MIN);
    dur = pathLength / speed;

    if (omega !== 0) {
      // AC travels 0→1→0 (2× distance); higher frequency also speeds things up logarithmically
      const freq = omega / (2 * Math.PI);
      const freqFactor = 1 + Math.max(0, Math.log10(freq)); // 1Hz→1×, 10Hz→2×, 100Hz→3×, …
      dur = dur * 2 / freqFactor;
    }

    if (omega === 0) {
      const realPart = typeof current === 'number' ? current : (current as { re: number }).re;
      keyPoints = realPart >= 0 ? '0;1' : '1;0';
    } else {
      keyPoints = '0;1;0';
      keyTimes = '0;0.5;1';
    }
  }

  return (
    <>
      {/* Wide transparent hit area for easier selection */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="react-flow__edge-interaction"
      />
      {/* Base wire — also serves as the mpath target */}
      <path
        ref={pathRef}
        id={pathId}
        d={edgePath}
        fill="none"
        strokeWidth={selected ? 2.5 : 1.8}
        stroke="var(--schematic-stroke)"
        opacity={selected ? 1 : 0.85}
      />
      {/* Moving electron dots */}
      {isAnimated && Array.from({ length: nDots }, (_, i) => (
        <circle key={i} r={3} fill="var(--accent)">
          <animateMotion
            dur={`${dur}s`}
            repeatCount="indefinite"
            keyPoints={keyPoints}
            keyTimes={keyTimes}
            calcMode="linear"
            begin={`-${(dur * i / nDots).toFixed(3)}s`}
          >
            <mpath href={`#${pathId}`} />
          </animateMotion>
        </circle>
      ))}
    </>
  );
}
