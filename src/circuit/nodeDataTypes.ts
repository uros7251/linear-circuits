import type { MathNumericType } from 'mathjs';

export type NodeType =
  | 'resistor'
  | 'inductor'
  | 'capacitor'
  | 'impedance'
  | 'currentsource'
  | 'voltagesource';

export interface SolverState {
  current: MathNumericType;
  voltage: MathNumericType;
}

interface BaseNodeData {
  label: string;
  unit: string;
  rotation: number;
}

export interface ResistorData extends BaseNodeData {
  resistance: number;
}

export interface InductorData extends BaseNodeData {
  inductance: number;
}

export interface CapacitorData extends BaseNodeData {
  capacitance: number;
}

export interface ImpedanceData extends BaseNodeData {
  real: number;
  imag: number;
}

export interface CurrentSourceData extends BaseNodeData {
  real: number;
  imag: number;
}

export interface VoltageSourceData extends BaseNodeData {
  real: number;
  imag: number;
}

export type NodeData =
  | ResistorData
  | InductorData
  | CapacitorData
  | ImpedanceData
  | CurrentSourceData
  | VoltageSourceData;
