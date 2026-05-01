import type { Node, Edge } from 'reactflow';
import type { NodeData } from './nodeDataTypes';

export interface ExampleCircuit {
  name: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  omega: number;
}

const wire = (id: string, source: string, sh: string, target: string, th: string): Edge => ({
  id, source, sourceHandle: sh, target, targetHandle: th, type: 'animatedWire',
});

export const EXAMPLE_CIRCUITS: ExampleCircuit[] = [
  {
    name: 'Voltage Divider',
    omega: 0,
    nodes: [
      { id: 'vs1', type: 'voltagesource', position: { x: 60, y: 78 }, data: { label: 'Vs', real: 5, imag: 0, unit: 'V', rotation: 90 } },
      { id: 'r1',  type: 'resistor',      position: { x: 146, y: 39 }, data: { label: 'R1', resistance: 1, unit: 'kΩ', rotation: 0 } },
      { id: 'r2',  type: 'resistor',      position: { x: 297, y: 78 }, data: { label: 'R2', resistance: 2, unit: 'kΩ', rotation: 90 } },
    ],
    edges: [
      wire('e1', 'vs1', 'left',  'r1',  'left'),
      wire('e2', 'r1',  'right', 'r2',  'left'),
      wire('e3', 'r2',  'right', 'vs1', 'right'),
    ],
  },
  {
    name: 'RC Low-pass Filter',
    omega: 2 * Math.PI * 50,
    nodes: [
      { id: 'vs1', type: 'voltagesource', position: { x: 60, y: 78 }, data: { label: 'Vs', real: 5, imag: 0, unit: 'V', rotation: 90 } },
      { id: 'r1',  type: 'resistor',      position: { x: 146, y: 39 }, data: { label: 'R1', resistance: 1, unit: 'kΩ', rotation: 0 } },
      { id: 'c1',  type: 'capacitor',     position: { x: 289, y: 78 }, data: { label: 'C1', capacitance: 0.16, unit: 'μF', rotation: 90 } },
    ],
    edges: [
      wire('e1', 'vs1', 'left',  'r1',  'left'),
      wire('e2', 'r1',  'right', 'c1',  'left'),
      wire('e3', 'c1',  'right', 'vs1', 'right'),
    ],
  },
  {
    // L=10mH, C=2.53μF → resonance ≈ 1kHz; Q≈6.3 so V_L = V_C ≈ 63V
    name: 'Series RLC — Resonance',
    omega: 2 * Math.PI * 1000,
    nodes: [
      { id: 'vs1', type: 'voltagesource', position: { x: 60,  y: 78  }, data: { label: 'Vs', real: 10, imag: 0, unit: 'V',  rotation: 90  } },
      { id: 'r1',  type: 'resistor',      position: { x: 146, y: 39  }, data: { label: 'R1', resistance: 10, unit: 'Ω',   rotation: 0   } },
      { id: 'l1',  type: 'inductor',      position: { x: 297, y: 78  }, data: { label: 'L1', inductance: 10, unit: 'mH',  rotation: 90  } },
      { id: 'c1',  type: 'capacitor',     position: { x: 146, y: 185 }, data: { label: 'C1', capacitance: 2.53, unit: 'μF', rotation: 180 } },
    ],
    edges: [
      wire('e1', 'vs1', 'left',  'r1',  'left'),
      wire('e2', 'r1',  'right', 'l1',  'left'),
      wire('e3', 'l1',  'right', 'c1',  'left'),
      wire('e4', 'c1',  'right', 'vs1', 'right'),
    ],
  },
  {
    // R1/R3 = R2/R4 → balanced; no current flows through the plain wire bridge arm
    name: 'Wheatstone Bridge',
    omega: 0,
    nodes: [
      { id: 'vs1', type: 'voltagesource', position: { x: 244, y: 254 }, data: { label: 'Vs', real: 5, imag: 0, unit: 'V', rotation: 180 } },
      { id: 'r1',  type: 'resistor',      position: { x: 162, y: 4   }, data: { label: 'R1', resistance: 1, unit: 'kΩ', rotation: 0 } },
      { id: 'r3',  type: 'resistor',      position: { x: 327, y: 4   }, data: { label: 'R3', resistance: 2, unit: 'kΩ', rotation: 0 } },
      { id: 'r2',  type: 'resistor',      position: { x: 162, y: 179 }, data: { label: 'R2', resistance: 2, unit: 'kΩ', rotation: 0 } },
      { id: 'r4',  type: 'resistor',      position: { x: 327, y: 179 }, data: { label: 'R4', resistance: 4, unit: 'kΩ', rotation: 0 } },
    ],
    edges: [
      wire('e1', 'vs1', 'right', 'r1',  'left'),
      wire('e2', 'vs1', 'right', 'r2',  'left'),
      wire('e3', 'r1',  'right', 'r3',  'left'),
      wire('e4', 'r2',  'right', 'r3',  'left'),
      wire('e5', 'r2',  'right', 'r4',  'left'),
      wire('e7', 'r3',  'right', 'vs1', 'left'),
      wire('e8', 'r4',  'right', 'vs1', 'left'),
    ],
  },
];
