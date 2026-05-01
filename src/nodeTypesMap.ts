import ResistorNode from './components/nodes/ResistorNode';
import InductorNode from './components/nodes/InductorNode';
import CapacitorNode from './components/nodes/CapacitorNode';
import ImpedanceNode from './components/nodes/ImpedanceNode';
import CurrentSourceNode from './components/nodes/CurrentSourceNode';
import VoltageSourceNode from './components/nodes/VoltageSourceNode';

export const nodeTypes = {
  resistor: ResistorNode,
  inductor: InductorNode,
  capacitor: CapacitorNode,
  impedance: ImpedanceNode,
  currentsource: CurrentSourceNode,
  voltagesource: VoltageSourceNode,
}; 