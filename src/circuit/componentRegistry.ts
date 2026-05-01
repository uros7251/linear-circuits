import type {
  NodeType,
  NodeData,
  ResistorData,
  InductorData,
  CapacitorData,
  ImpedanceData,
  CurrentSourceData,
  VoltageSourceData,
} from './nodeDataTypes';
import { DISPLAY_PREFIXES, getPrefixSymbol } from '../solver/SIUnits';

function makeUnitOptions(baseUnit: string): UnitOption[] {
  return DISPLAY_PREFIXES.map(p => {
    const unit = getPrefixSymbol(p)! + baseUnit;
    return { value: unit, label: unit };
  });
}

export interface UnitOption {
  value: string;
  label: string;
}

export interface ComponentConfig {
  displayName: string;
  defaultData: (id: string) => NodeData;
  unitOptions: UnitOption[];
}

export const COMPONENT_REGISTRY: Record<NodeType, ComponentConfig> = {
  resistor: {
    displayName: 'Resistor',
    defaultData: (id): ResistorData => ({ label: `R${id}`, resistance: 1, unit: 'Ω', rotation: 0 }),
    unitOptions: makeUnitOptions('Ω'),
  },
  inductor: {
    displayName: 'Inductor',
    defaultData: (id): InductorData => ({ label: `L${id}`, inductance: 1, unit: 'H', rotation: 0 }),
    unitOptions: makeUnitOptions('H'),
  },
  capacitor: {
    displayName: 'Capacitor',
    defaultData: (id): CapacitorData => ({ label: `C${id}`, capacitance: 1, unit: 'F', rotation: 0 }),
    unitOptions: makeUnitOptions('F'),
  },
  impedance: {
    displayName: 'Impedance',
    defaultData: (id): ImpedanceData => ({ label: `Z${id}`, real: 1, imag: 0, unit: 'Ω', rotation: 0 }),
    unitOptions: makeUnitOptions('Ω'),
  },
  currentsource: {
    displayName: 'Current Source',
    defaultData: (id): CurrentSourceData => ({ label: `J${id}`, real: 1, imag: 0, unit: 'A', rotation: 0 }),
    unitOptions: makeUnitOptions('A'),
  },
  voltagesource: {
    displayName: 'Voltage Source',
    defaultData: (id): VoltageSourceData => ({ label: `V${id}`, real: 1, imag: 0, unit: 'V', rotation: 0 }),
    unitOptions: makeUnitOptions('V'),
  },
};

export const NODE_TYPES = Object.keys(COMPONENT_REGISTRY) as NodeType[];
