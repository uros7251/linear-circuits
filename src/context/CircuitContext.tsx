import { createContext, useContext } from 'react';
import type { MathNumericType } from 'mathjs';
import type { SolverState } from '../circuit/nodeDataTypes';

export interface SolverResults {
  /** Map from component label to its solved [current, voltage] state. */
  states: Map<string, SolverState>;
  /** Map from edge id to its solved current. */
  edgeCurrents: Map<string, MathNumericType>;
  error: string | null;
}

export interface CircuitContextValue {
  solverResults: SolverResults;
  omega: number;
  setOmega: (omega: number) => void;
  onRotate: (nodeId: string) => void;
}

export const CircuitContext = createContext<CircuitContextValue | null>(null);

export function useCircuitContext(): CircuitContextValue {
  const ctx = useContext(CircuitContext);
  if (!ctx) throw new Error('useCircuitContext must be used within a CircuitContext.Provider');
  return ctx;
}
