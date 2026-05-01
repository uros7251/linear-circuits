/**
 * CircuitSolver: Encapsulates logic for solving linear electric circuits.
 */
import { Branch } from './Branch';
import { ComponentType, TwoTerminalComponent } from './TwoTerminalComponent';
import {
  add,
  multiply,
  pinv,
  subtract,
  unaryMinus,
  zeros,
  matrix,
} from 'mathjs';
import type { MathNumericType, Matrix } from 'mathjs';

export class CircuitSolver {
  private components!: Map<string, TwoTerminalComponent>;
  private circuits!: Branch[][];

  /**
   * Constructs a CircuitSolver from a list of branches.
   *
   * Branch.reduce() is called first to collapse all series/parallel
   * sub-topologies into composite components. The MNA matrix is then built
   * only for the irreducible skeleton, keeping the system as small as possible.
   * After solving, applyCurrent/applyVoltage on each reduced branch propagates
   * the solution recursively into every original leaf component.
   */
  constructor(branches: Branch[]) {
    this.circuits = CircuitSolver.disjunctCircuits(Branch.reduce(branches));
    this.initComponentsDict();
  }

  solve(omega: number = 0): void {
    for (const branches of this.circuits) {
      CircuitSolver.solve(branches, omega);
    }
  }

  /**
   * Returns the state (current, voltage) of a component by label.
   */
  stateAt(label: string): [MathNumericType, MathNumericType] | null {
    const component = this.components.get(label);
    if (!component || !component.state) return null;
    return [component.current!, component.voltage!];
  }

  // --- Private helpers ---

  private initComponentsDict(): void {
    this.components = new Map<string, TwoTerminalComponent>();
    for (const branches of this.circuits) {
      for (const branch of branches) {
        for (const component of branch.component) {
          this.components.set(component.label, component);
        }
      }
    }
  }

  private static solveSingleBranch(
    branch: Branch,
    omega: number,
  ): void {
    const component = branch.component;
    const isLoop = branch.source === branch.sink;
    if (
      !isLoop ||
      component.componentType === ComponentType.IDEAL_VOLTAGE_SOURCE ||
      component.componentType === ComponentType.PARALLEL
    ) {
      component.applyCurrent(0, omega, true);
    } else {
      component.applyVoltage(0, omega, true);
    }
  }

  /**
   * Solves the circuit for node voltages and branch currents.
   */
  private static solve(branches: Branch[], omega: number): void {
    if (branches.length === 1) {
      return this.solveSingleBranch(branches[0], omega);
    }

    // Assign a matrix index to each unique node
    const nodeVoltages = new Map<number, number>();
    let nodeIndex = 0;
    for (const b of branches) {
      if (!nodeVoltages.has(b.source)) nodeVoltages.set(b.source, nodeIndex++);
      if (b.sink !== b.source && !nodeVoltages.has(b.sink)) nodeVoltages.set(b.sink, nodeIndex++);
    }

    // Assign extra matrix indices to fixed-voltage branches (their currents are unknowns)
    const branchCurrents = new Map<number, number>();
    let branchCurrentIndex = nodeVoltages.size;
    for (const [i, b] of branches.entries()) {
      if (b.component.currentVoltageCharacteristic(omega).hasFixedVoltage) {
        branchCurrents.set(i, branchCurrentIndex++);
      }
    }

    // Create the system of equations:
    //  - N node equations (KCL)
    //  - E equations (one for each ideal voltage source)
    //  - 1 equation setting the reference node's voltage to 0
    const N = nodeVoltages.size + branchCurrents.size;
    const A = matrix(zeros([N + 1, N], 'sparse'));
    const b = matrix(zeros([N + 1, 1], 'sparse'));
    const addAt = (m: Matrix<MathNumericType>, index: number[], value: MathNumericType) => {
      m.set(index, add(m.get(index), value));
    };

    for (const [i, branch] of branches.entries()) {
      const cvChar = branch.component.currentVoltageCharacteristic(omega);
      const sourceNodeIdx = nodeVoltages.get(branch.source)!;
      const sinkNodeIdx = nodeVoltages.get(branch.sink)!;
      if (cvChar.hasFixedVoltage) {
        const currentIdx = branchCurrents.get(i)!;
        addAt(A, [sourceNodeIdx, currentIdx], 1);
        addAt(A, [sinkNodeIdx, currentIdx], -1);
        addAt(A, [currentIdx, sourceNodeIdx], 1);
        addAt(A, [currentIdx, sinkNodeIdx], -1);
        addAt(b, [currentIdx, 0], cvChar.voltageAtCurrent(0));
      } else {
        addAt(A, [sourceNodeIdx, sourceNodeIdx], cvChar.admittanceCoefficient);
        addAt(A, [sourceNodeIdx, sinkNodeIdx], unaryMinus(cvChar.admittanceCoefficient));
        addAt(b, [sourceNodeIdx, 0], unaryMinus(cvChar.freeCoefficient));
        addAt(A, [sinkNodeIdx, sourceNodeIdx], unaryMinus(cvChar.admittanceCoefficient));
        addAt(A, [sinkNodeIdx, sinkNodeIdx], cvChar.admittanceCoefficient);
        addAt(b, [sinkNodeIdx, 0], cvChar.freeCoefficient);
      }
    }
    addAt(A, [N, 0], 1);

    const x = multiply(pinv(A), b);
    for (const [i, branch] of branches.entries()) {
      if (branchCurrents.has(i)) {
        const currentIndex = branchCurrents.get(i)!;
        const current = x.get([currentIndex, 0]) as MathNumericType;
        branch.applyCurrent(current, omega);
      } else {
        const sourceVoltage = x.get([nodeVoltages.get(branch.source)!, 0]) as MathNumericType;
        const sinkVoltage = x.get([nodeVoltages.get(branch.sink)!, 0]) as MathNumericType;
        branch.applyVoltage(subtract(sourceVoltage, sinkVoltage), omega);
      }
    }
  }

  private static disjunctCircuits(branches: Branch[]): Branch[][] {
    const representatives = new Map<number, number>();
    const find = (node: number): number => {
      if (!representatives.has(node)) { representatives.set(node, node); return node; }
      let root = representatives.get(node)!;
      if (root !== node) { root = find(root); representatives.set(node, root); }
      return root;
    };
    for (const branch of branches) {
      const ra = find(branch.source), rb = find(branch.sink);
      if (ra !== rb) representatives.set(rb, ra);
    }
    const components = new Map<number, Branch[]>();
    for (const branch of branches) {
      const representative = find(branch.source);
      if (!components.has(representative)) components.set(representative, []);
      components.get(representative)!.push(branch);
    }
    return Array.from(components.values());
  }
}
