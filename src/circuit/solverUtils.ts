import type { MathNumericType } from 'mathjs';
import { TwoTerminalComponent } from '../solver/TwoTerminalComponent';
import type { SolverState } from './nodeDataTypes';

/** Complex apparent power S = V × I* from a solved component state. */
export function powerFromState(state: SolverState): MathNumericType {
  return TwoTerminalComponent.computePower(state.current, state.voltage);
}
