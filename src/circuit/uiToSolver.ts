/**
 * Converts UI circuit representation (React Flow nodes/edges) to solver format.
 */
import type { Node, Edge } from 'reactflow';
import { complex } from 'mathjs';
import { Branch } from '../solver/Branch';
import {
  Ammeter,
  Resistor,
  Capacitor,
  Inductor,
  Impedance,
  IdealVoltageSource,
  IdealCurrentSource,
  type TwoTerminalComponent,
} from '../solver/TwoTerminalComponent';
import { DISPLAY_PREFIXES, getPrefixSymbol, SIPrefix } from '../solver/SIUnits';
import type {
  NodeData,
  ResistorData,
  InductorData,
  CapacitorData,
  ImpedanceData,
  CurrentSourceData,
  VoltageSourceData,
} from './nodeDataTypes';

/** UI unit string → SIPrefix multiplier, generated from all display prefixes × base units. */
const UNIT_TO_PREFIX: Record<string, SIPrefix> = Object.fromEntries(
  ['Ω', 'F', 'H', 'V', 'A'].flatMap(base =>
    DISPLAY_PREFIXES.map(p => [getPrefixSymbol(p)! + base, p]),
  ),
);

function toSIPrefix(unit: string | undefined): SIPrefix {
  return UNIT_TO_PREFIX[unit ?? ''] ?? SIPrefix.Nil;
}

function createComponent(type: string, label: string, data: NodeData): TwoTerminalComponent {
  const prefix = toSIPrefix(data.unit);
  switch (type) {
    case 'resistor':
      return new Resistor(label, (data as ResistorData).resistance, prefix);
    case 'inductor':
      return new Inductor(label, (data as InductorData).inductance, prefix);
    case 'capacitor':
      return new Capacitor(label, (data as CapacitorData).capacitance, prefix);
    case 'impedance': {
      const d = data as ImpedanceData;
      return new Impedance(label, complex(d.real, d.imag), prefix);
    }
    case 'currentsource': {
      const d = data as CurrentSourceData;
      return new IdealCurrentSource(label, complex(d.real, d.imag), prefix);
    }
    case 'voltagesource': {
      const d = data as VoltageSourceData;
      return new IdealVoltageSource(label, complex(d.real, d.imag), prefix);
    }
    default:
      throw new Error(`Unknown component type: ${type}`);
  }
}

export interface CircuitFromUI {
  branches: Branch[];
  terminalNodes: string[];
}

/**
 * Converts React Flow nodes and edges to solver Branch array.
 * - Each component node becomes a branch between its two terminals.
 * - Each edge becomes an Ammeter branch (wire) so edge currents are trackable via solver.stateAt(edge.id).
 */
export function circuitFromUI(nodes: Node<NodeData>[], edges: Edge[]): CircuitFromUI {
  const terminalNodes = nodes.flatMap(n => [`${n.id}:left`, `${n.id}:right`]);
  const terminalToIdx = new Map(terminalNodes.map((id, i) => [id, i]));

  const componentBranches = nodes.map(n => {
    const from = terminalToIdx.get(`${n.id}:left`)!;
    const to = terminalToIdx.get(`${n.id}:right`)!;
    return new Branch(from, to, [
      createComponent(n.type as string, String(n.data?.label ?? n.id), n.data),
    ]);
  });

  const wireBranches = edges.flatMap(e => {
    if (!e.sourceHandle || !e.targetHandle) return [];
    const i1 = terminalToIdx.get(`${e.source}:${e.sourceHandle}`);
    const i2 = terminalToIdx.get(`${e.target}:${e.targetHandle}`);
    if (i1 === undefined || i2 === undefined) return [];
    return [new Branch(i1, i2, [new Ammeter(e.id)])];
  });

  return { branches: [...componentBranches, ...wireBranches], terminalNodes };
}
