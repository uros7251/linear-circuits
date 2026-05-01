import { describe, test, expect } from "vitest";
import { CircuitSolver } from "./CircuitSolver";
import { Branch } from "./Branch";
import { Resistor, Capacitor, Inductor, Impedance, IdealCurrentSource, IdealVoltageSource, Ammeter } from "./TwoTerminalComponent";
import { add, complex } from "mathjs";
import type { Complex } from "mathjs";
import { SIPrefix } from "./SIUnits";
function isClose(a: Complex, b: Complex, tol = 1e-6): boolean {
  return Math.abs(a.re - b.re) < tol && Math.abs(a.im - b.im) < tol;
}

describe("CircuitSolver", () => {
  test("single branch voltage source", () => {
    const v = new IdealVoltageSource("V", 5);
    const b = new Branch(0, 1, [v]);
    const c = new CircuitSolver([b]);
    c.solve();

    const vState = c.stateAt("V");
    expect(vState).not.toBeNull();
    if (vState) {
      expect(vState[0]).toBeCloseTo(0);
    }
  });

  test("single branch resistor", () => {
    const r = new Resistor("R", 10);
    const b = new Branch(0, 1, [r]);
    const c = new CircuitSolver([b]);
    c.solve();

    const rState = c.stateAt("R");
    expect(rState).not.toBeNull();
    if (rState) {
      // With zero voltage, current should be zero
      expect(rState[0]).toBeCloseTo(0);
      expect(rState[1]).toBeCloseTo(0);
    }
  });

  test("disconnected circuit", () => {
    const r1 = new Resistor("R1", 10);
    const e1 = new Resistor("E1", 20);
    const b1 = new Branch(0, 1, [r1]);
    const b2 = new Branch(2, 3, [e1]);
    const c = new CircuitSolver([b1, b2]);
    
    // Should not raise, but some nodes will be at default potential
    c.solve();

    const r1State = c.stateAt("R1");
    const e1State = c.stateAt("E1");
    expect(r1State).not.toBeNull();
    expect(e1State).not.toBeNull();

    if (r1State) {
      expect(r1State[0]).toBeCloseTo(0);
    }
    if (e1State) {
      expect(e1State[0]).toBeCloseTo(0);
    }
  });

  test("hanging component", () => {
    const r1 = new Resistor("R1", 10);
    const r2 = new Resistor("R2", 15)
    const e1 = new Resistor("E1", 20);
    const b1 = new Branch(0, 0, [r1, e1]);
    const b2 = new Branch(0, 1, [r2]);
    const c = new CircuitSolver([b1, b2]);
    
    c.solve();

    const r2State = c.stateAt("R2");
    expect(r2State).not.toBeNull();
    expect(r2State?.[0]).toBeCloseTo(0)
    expect(r2State?.[1]).toBeCloseTo(0)
  });

  test("state at nonexistent label", () => {
    const r = new Resistor("R", 10);
    const b = new Branch(0, 1, [r]);
    const c = new CircuitSolver([b]);
    c.solve();
    
    const state = c.stateAt("not_in_circuit");
    expect(state).toBeNull();
  });

  test("state at duplicate labels", () => {
    // This is not possible with the current implementation, as labels are keys in a Map
    // So we just check that the last component with the label is the one returned
    const r1 = new Resistor("R", 10);
    const r2 = new Resistor("R", 20);
    const b1 = new Branch(0, 1, [r1]);
    const b2 = new Branch(1, 2, [r2]);
    const c = new CircuitSolver([b1, b2]);
    c.solve();
    
    // The last one added to the Map will be returned
    const state = c.stateAt("R");
    expect(state).not.toBeNull();
    
    // It should match r2's state
    if (state) {
      const r2State = r2.state;
      expect(r2State).not.toBeNull();
      if (r2State) {
        expect(r2State[0]).toBe(state[0]);
        expect(r2State[1]).toBe(state[1]);
      }
    }
  });

  test("AC circuit with capacitors and inductors", () => {
    const r = new Resistor("R", 100);
    const c = new Capacitor("C", 1e-6); // 1 μF
    const l = new Inductor("L", 1e-3); // 1 mH
    const v = new IdealVoltageSource("V", 10); // 10V DC

    const branches = [
      new Branch(0, 1, [v, r]),
      new Branch(1, 2, [c]),
      new Branch(2, 0, [l]),
    ];

    const circuit = new CircuitSolver(branches);
    circuit.solve(1000); // 1kHz

    // Check that all components have states
    const rState = circuit.stateAt("R");
    const cState = circuit.stateAt("C");
    const lState = circuit.stateAt("L");
    const vState = circuit.stateAt("V");

    expect(rState).not.toBeNull();
    expect(cState).not.toBeNull();
    expect(lState).not.toBeNull();
    expect(vState).not.toBeNull();
  });

  test("parallel resistors", () => {
    const r1 = new Resistor("R1", 10);
    const r2 = new Resistor("R2", 20);
    const v = new IdealVoltageSource("V", 5);

    const branches = [
      new Branch(0, 1, [v]),
      new Branch(0, 1, [r1]),
      new Branch(0, 1, [r2]),
    ];

    const circuit = new CircuitSolver(branches);
    circuit.solve();

    const r1State = circuit.stateAt("R1");
    const r2State = circuit.stateAt("R2");

    expect(r1State).not.toBeNull();
    expect(r2State).not.toBeNull();

    if (r1State && r2State) {
      // In parallel, voltage should be the same
      expect(r1State[1]).toBeCloseTo(r2State[1] as number);
      // Currents should add up to total current
      const totalCurrent = add(r1State[0], r2State[0]);
      expect(totalCurrent).toBeCloseTo(0.75); // 5 * (1/10 + 1/20) = 0.75
    }
  });

  test("series resistors", () => {
    const r1 = new Resistor("R1", 10);
    const r2 = new Resistor("R2", 20);
    const v = new IdealVoltageSource("V", 6);

    const branches = [
      new Branch(0, 1, [v, r1]),
      new Branch(1, 0, [r2]),
    ];

    const circuit = new CircuitSolver(branches);
    circuit.solve();

    const r1State = circuit.stateAt("R1");
    const r2State = circuit.stateAt("R2");

    expect(r1State).not.toBeNull();
    expect(r2State).not.toBeNull();

    if (r1State && r2State) {
      // In series, current should be the same
      expect(r1State[0]).toBeCloseTo(r2State[0] as number);
      // Current should be 6V / 30Ω = 0.2A
      expect(r1State[0]).toBeCloseTo(-0.2);
      // Voltages should add up to total voltage
      const totalVoltage = add(r1State[1], r2State[1]);
      expect(totalVoltage).toBeCloseTo(-6);
    }
  });

  test("mitic textbook example", () => {
    const r1 = new Resistor("R1", 200);
    const r2 = new Resistor("R2", 100);
    const r3 = new Resistor("R3", 100);
    const r4 = new Resistor("R4", 50);
    const r5 = new Resistor("R5", 100);

    const e1 = new IdealVoltageSource("E1", 1);
    const j1 = new IdealCurrentSource("J1", 20, SIPrefix.Milli);
    const j2 = new IdealCurrentSource("J2", 10, SIPrefix.Milli);

    const branches = [
      new Branch(1, 4, [j1, r1]),
      new Branch(1, 4, [r2]),
      new Branch(1, 2, [r3]),
      new Branch(2, 3, [r4, e1.flip()]),
      new Branch(2, 3, [r5]),
      new Branch(3, 4, [j2]),
    ];

    const circuit = new CircuitSolver(branches);
    circuit.solve();

    // Check component states
    const r1State = circuit.stateAt("R1");
    const j1State = circuit.stateAt("J1");
    const r2State = circuit.stateAt("R2");
    const r3State = circuit.stateAt("R3");
    const r4State = circuit.stateAt("R4");
    const e1State = circuit.stateAt("E1");
    const r5State = circuit.stateAt("R5");
    const j2State = circuit.stateAt("J2");

    expect(r1State).not.toBeNull();
    expect(j1State).not.toBeNull();
    expect(r2State).not.toBeNull();
    expect(r3State).not.toBeNull();
    expect(r4State).not.toBeNull();
    expect(e1State).not.toBeNull();
    expect(r5State).not.toBeNull();
    expect(j2State).not.toBeNull();

    if (r1State) {
      expect(r1State[0]).toBeCloseTo(20e-3);
      expect(r1State[1]).toBeCloseTo(4);
    }

    if (j1State) {
      expect(j1State[1]).toBeCloseTo(-7);
    }

    if (r2State) {
      expect(r2State[0]).toBeCloseTo(-30e-3)
      expect(r2State[1]).toBeCloseTo(-3);
    }

    if (r3State) {
      expect(r3State[0]).toBeCloseTo(10e-3);
      expect(r3State[1]).toBeCloseTo(1);
    }

    if (r4State) {
      expect(r4State[0]).toBeCloseTo(40e-3 / 3);
      expect(r4State[1]).toBeCloseTo(2 / 3);
    }

    if (e1State) {
      expect(e1State[0]).toBeCloseTo(-40e-3 / 3);
    }

    if (r5State) {
      expect(r5State[0]).toBeCloseTo(-10e-3 / 3);
      expect(r5State[1]).toBeCloseTo(-1 / 3);
    }

    if (j2State) {
      expect(j2State[1]).toBeCloseTo(-11 / 3);
    }
  });

  test("mitic 12.7 example", () => {
    const r1 = new Resistor("R1", 1);
    const r2 = new Resistor("R2", 2);
    const r3 = new Resistor("R3", 1);
    const r4 = new Resistor("R4", 2);
    const r5 = new Resistor("R5", 1);

    const e1 = new IdealVoltageSource("E1", 1);
    const e2 = new IdealVoltageSource("E2", 2);
    const e3 = new IdealVoltageSource("E3", 3);
    const e4 = new IdealVoltageSource("E4", 7);
    const e5 = new IdealVoltageSource("E5", 3);

    const branches = [
      new Branch(1, 2, [e1, r1]),
      new Branch(1, 3, [e2.flip(), r2]),
      new Branch(1, 4, [e3.flip(), r3]),
      new Branch(2, 3, [r5]),
      new Branch(2, 4, [r4, e4.flip()]),
      new Branch(3, 4, [e5]),
    ];

    const circuit = new CircuitSolver(branches);
    circuit.solve();

    // Check component states
    const r1State = circuit.stateAt("R1");
    const r2State = circuit.stateAt("R2");
    const r3State = circuit.stateAt("R3");
    const r4State = circuit.stateAt("R4");
    const r5State = circuit.stateAt("R5");
    const e5State = circuit.stateAt("E5");

    expect(r1State).not.toBeNull();
    expect(r2State).not.toBeNull();
    expect(r3State).not.toBeNull();
    expect(r4State).not.toBeNull();
    expect(r5State).not.toBeNull();
    expect(e5State).not.toBeNull();

    if (r1State) {
      expect(r1State[0]).toBeCloseTo(-1);
    }
    if (r2State) {
      expect(r2State[0]).toBeCloseTo(-1);
    }
    if (r3State) {
      expect(r3State[0]).toBeCloseTo(2);
    }
    if (r4State) {
      expect(r4State[0]).toBeCloseTo(3);
    }
    if (r5State) {
      expect(r5State[0]).toBeCloseTo(-4);
    }
    if (e5State) {
      expect(e5State[0]).toBeCloseTo(-5);
    }
  });

  test("mitic 8.1 complex example", () => {
    const z1 = new Impedance("Z1", complex(0.5, -1));
    const z2 = new Impedance("Z2", complex(0, -2));
    const z3 = new Impedance("Z3", complex(1, 0));
    const z5 = new Impedance("Z5", complex(0, 1));
    const z4 = new Impedance("Z4", complex(1, -0.5));

    const e1 = new IdealVoltageSource("E1", complex(-3, 2));
    const e2 = new IdealVoltageSource("E2", complex(1, 0));
    const j = new IdealCurrentSource("J", complex(1, -1));

    const branches = [
      new Branch(1, 2, [z4]),
      new Branch(1, 3, [j, z2]),
      new Branch(1, 4, [e1, z1]),
      new Branch(2, 3, [z5]),
      new Branch(2, 4, [z3]),
      new Branch(3, 4, [e2]),
    ];

    const circuit = new CircuitSolver(branches);
    circuit.solve();

    // Check component states
    const z1State = circuit.stateAt("Z1") as [Complex, Complex];
    const z3State = circuit.stateAt("Z3") as [Complex, Complex];
    const e2State = circuit.stateAt("E2") as [Complex, Complex];
    const e1State = circuit.stateAt("E1") as [Complex, Complex];
    const z4State = circuit.stateAt("Z4") as [Complex, Complex];
    const z5State = circuit.stateAt("Z5") as [Complex, Complex];
    const jState = circuit.stateAt("J") as [Complex, Complex];

    expect(z1State).not.toBeNull();
    expect(z3State).not.toBeNull();
    expect(e2State).not.toBeNull();
    expect(e1State).not.toBeNull();
    expect(z4State).not.toBeNull();
    expect(z5State).not.toBeNull();
    expect(jState).not.toBeNull();

    if (z1State) {
      expect(isClose(z1State[0], complex(1, 0))).toBe(true);
    }
    if (z3State) {
      expect(isClose(z3State[0], complex(-1, -1))).toBe(true);
    }
    if (e2State) {
      expect(isClose(e2State[0], complex(0, 1))).toBe(true);
    }
    if (e1State) {
      expect(isClose(e1State[0], complex(1, 0))).toBe(true);
    }
    if (z4State) {
      expect(isClose(z4State[0], complex(-2, 1))).toBe(true);
    }
    if (z5State) {
      expect(isClose(z5State[0], complex(-1, 2))).toBe(true);
    }
    if (jState) {
      expect(isClose(jState[1], complex(-1.5, 3))).toBe(true);
    }
  });

  test("Wheatstone bridge - disconnected arm behaves as parallel circuit", () => {
    // Same topology as above but R5's sink is node 10 (isolated).
    // Node 10 has degree 1, so KCL forces I_R5 = 0 and V_10 floats to V_2.
    // The result is just two independent series arms in parallel.
    const vs = new IdealVoltageSource("Vs", 5);
    const r1 = new Resistor("R1", 1000);
    const r2 = new Resistor("R2", 2000);
    const r3 = new Resistor("R3", 2000);
    const r4 = new Resistor("R4", 4000);
    const r5 = new Resistor("R5", 1000);

    const circuit = new CircuitSolver([
      new Branch(0, 1, [vs]),
      new Branch(0, 2, [r1]),
      new Branch(0, 3, [r2]),
      new Branch(2, 1, [r3]),
      new Branch(3, 1, [r4]),
      new Branch(2, 10, [r5]),  // sink changed to isolated node 10
    ]);
    circuit.solve();

    // Bridge arm: isolated node forces zero current; voltage across R5 is zero
    expect(circuit.stateAt("R5")?.[0]).toBeCloseTo(0, 6);
    expect(circuit.stateAt("R5")?.[1]).toBeCloseTo(0);

    // Left arm (R1 + R3 = 3 kΩ): I = 5/3 mA
    expect(circuit.stateAt("R1")?.[0]).toBeCloseTo(5 / 3000, 6);
    expect(circuit.stateAt("R3")?.[0]).toBeCloseTo(5 / 3000, 6);

    // Right arm (R2 + R4 = 6 kΩ): I = 5/6 mA
    expect(circuit.stateAt("R2")?.[0]).toBeCloseTo(5 / 6000, 6);
    expect(circuit.stateAt("R4")?.[0]).toBeCloseTo(5 / 6000, 6);

    // Total source current
    expect(circuit.stateAt("Vs")?.[0]).toBeCloseTo(-0.0025, 6);
  });

  test("K4 bridge of current sources - underdetermined voltages", () => {
    // K4 (complete graph on 4 nodes, 6 branches) is irreducible: every node has
    // degree 3 so no series/parallel reduction is possible. With only current
    // sources, all admittance terms are zero — the KCL matrix rows are all-zero
    // and the voltage system is underdetermined. pinv picks the minimum-norm
    // solution: V = 0 everywhere.
    //
    // KCL-satisfying currents (positive = flows in branch direction):
    //   node 0: J01 + J02 + J03 = 2 + 1 + (-3) = 0 ✓
    //   node 1: -J01 + J12 + J13 = -2 + 1 + 1 = 0 ✓
    //   node 2: -J02 - J12 + J23 = -1 - 1 + 2 = 0 ✓
    //   node 3: -J03 - J13 - J23 = 3 - 1 - 2 = 0 ✓
    const j01 = new IdealCurrentSource("J01", 2);
    const j02 = new IdealCurrentSource("J02", 1);
    const j03 = new IdealCurrentSource("J03", -3); // negative: 3A flows 3→0
    const j12 = new IdealCurrentSource("J12", 1);
    const j13 = new IdealCurrentSource("J13", 1);
    const j23 = new IdealCurrentSource("J23", 2);

    const circuit = new CircuitSolver([
      new Branch(0, 1, [j01]),
      new Branch(0, 2, [j02]),
      new Branch(0, 3, [j03]),
      new Branch(1, 2, [j12]),
      new Branch(1, 3, [j13]),
      new Branch(2, 3, [j23]),
    ]);
    circuit.solve();

    // All voltages are 0 (min-norm solution for underdetermined V)
    expect(circuit.stateAt("J01")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("J02")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("J03")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("J12")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("J13")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("J23")?.[1]).toBeCloseTo(0);

    // Currents match the specified source values
    expect(circuit.stateAt("J01")?.[0]).toBeCloseTo(2);
    expect(circuit.stateAt("J02")?.[0]).toBeCloseTo(1);
    expect(circuit.stateAt("J03")?.[0]).toBeCloseTo(-3);
    expect(circuit.stateAt("J12")?.[0]).toBeCloseTo(1);
    expect(circuit.stateAt("J13")?.[0]).toBeCloseTo(1);
    expect(circuit.stateAt("J23")?.[0]).toBeCloseTo(2);
  });

  test("Wheatstone bridge - balanced, no current through bridge arm", () => {
    // Topology (4 circuit nodes):
    //   Node 0 (supply)  --Vs(5V)-->  Node 1 (ground)
    //   Node 0  --R1(1kΩ)-->  Node 2 (mid-left)
    //   Node 0  --R2(2kΩ)-->  Node 3 (mid-right)
    //   Node 2  --R3(2kΩ)-->  Node 1
    //   Node 3  --R4(4kΩ)-->  Node 1
    //   Node 2  --R5(1kΩ)-->  Node 3  (bridge arm)
    //
    // Balance: R1/R3 = 1/2 = R2/R4 → V2 = V3 = 10/3 V → I_R5 = 0
    const vs = new IdealVoltageSource("Vs", 5);
    const r1 = new Resistor("R1", 1000);
    const r2 = new Resistor("R2", 2000);
    const r3 = new Resistor("R3", 2000);
    const r4 = new Resistor("R4", 4000);
    const r5 = new Resistor("R5", 1000);

    const circuit = new CircuitSolver([
      new Branch(0, 1, [vs]),
      new Branch(0, 2, [r1]),
      new Branch(0, 3, [r2]),
      new Branch(2, 1, [r3]),
      new Branch(3, 1, [r4]),
      new Branch(2, 3, [r5]),
    ]);
    circuit.solve();

    const vsState  = circuit.stateAt("Vs");
    const r1State  = circuit.stateAt("R1");
    const r2State  = circuit.stateAt("R2");
    const r3State  = circuit.stateAt("R3");
    const r4State  = circuit.stateAt("R4");
    const r5State  = circuit.stateAt("R5");

    expect(vsState).not.toBeNull();
    expect(r1State).not.toBeNull();
    expect(r2State).not.toBeNull();
    expect(r3State).not.toBeNull();
    expect(r4State).not.toBeNull();
    expect(r5State).not.toBeNull();

    // Balanced: bridge arm carries no current and has zero voltage
    expect(r5State?.[0]).toBeCloseTo(0);
    expect(r5State?.[1]).toBeCloseTo(0);

    // Left arm: I = 5/(3×1000) A, V_R1 = 5/3 V, V_R3 = 10/3 V
    expect(r1State?.[0]).toBeCloseTo(5 / 3000, 6);
    expect(r1State?.[1]).toBeCloseTo(5 / 3);
    expect(r3State?.[0]).toBeCloseTo(5 / 3000, 6);
    expect(r3State?.[1]).toBeCloseTo(10 / 3);

    // Right arm: I = 5/(6×1000) A, V_R2 = 5/3 V, V_R4 = 10/3 V
    expect(r2State?.[0]).toBeCloseTo(5 / 6000, 6);
    expect(r2State?.[1]).toBeCloseTo(5 / 3);
    expect(r4State?.[0]).toBeCloseTo(5 / 6000, 6);
    expect(r4State?.[1]).toBeCloseTo(10 / 3);

    // Source: 5 V, total current 2.5 mA (negative in branch direction 0→1)
    expect(vsState?.[1]).toBeCloseTo(5);
    expect(vsState?.[0]).toBeCloseTo(-0.0025, 6);
  });

  test("Wheatstone bridge - unbalanced, ammeter in bridge arm", () => {
    // Nodes: 0 (supply), 1 (ground), 2 (mid-left), 3 (mid-right)
    // Unbalanced: R1/R3 = 100/300 ≠ R2/R4 = 200/400
    // Ammeter shorts nodes 2 and 3 → V_mid = 7.2 V
    // I_A = I_R1 − I_R3 = 28 mA − 24 mA = 4 mA (flows 2 → 3)
    const vs = new IdealVoltageSource("Vs", 10);
    const r1 = new Resistor("R1", 100);
    const r2 = new Resistor("R2", 200);
    const r3 = new Resistor("R3", 300);
    const r4 = new Resistor("R4", 400);
    const a  = new Ammeter("A");

    const circuit = new CircuitSolver([
      new Branch(0, 1, [vs]),
      new Branch(0, 2, [r1]),
      new Branch(0, 3, [r2]),
      new Branch(2, 1, [r3]),
      new Branch(3, 1, [r4]),
      new Branch(2, 3, [a]),
    ]);
    circuit.solve();

    expect(circuit.stateAt("A")).not.toBeNull();

    // Ammeter: 0 V across it, 4 mA through it
    expect(circuit.stateAt("A")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("A")?.[0]).toBeCloseTo(0.004, 6);

    // Branch currents driven by V_mid = 7.2 V
    expect(circuit.stateAt("R1")?.[0]).toBeCloseTo(0.028, 6);
    expect(circuit.stateAt("R2")?.[0]).toBeCloseTo(0.014, 6);
    expect(circuit.stateAt("R3")?.[0]).toBeCloseTo(0.024, 6);
    expect(circuit.stateAt("R4")?.[0]).toBeCloseTo(0.018, 6);
  });

  test("K4 bridge of current sources - KCL violation silently ignored", () => {
    // Same K4 topology, but J03 changed from -3A to -2A: 1A imbalance at
    // nodes 0 and 3. Since all admittance terms are zero, the KCL residual
    // cannot be corrected via node voltages — pinv absorbs it silently.
    // Output is V=0 everywhere with no error thrown. Known limitation: KCL
    // violations in pure-current-source irreducible circuits are undetectable.
    const circuit = new CircuitSolver([
      new Branch(0, 1, [new IdealCurrentSource("J01", 2)]),
      new Branch(0, 2, [new IdealCurrentSource("J02", 1)]),
      new Branch(0, 3, [new IdealCurrentSource("J03", -2)]), // should be -3 for KCL
      new Branch(1, 2, [new IdealCurrentSource("J12", 1)]),
      new Branch(1, 3, [new IdealCurrentSource("J13", 1)]),
      new Branch(2, 3, [new IdealCurrentSource("J23", 2)]),
    ]);

    expect(() => circuit.solve()).not.toThrow();
    expect(circuit.stateAt("J01")?.[1]).toBeCloseTo(0);
    expect(circuit.stateAt("J03")?.[1]).toBeCloseTo(0);
  });
}); 