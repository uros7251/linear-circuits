import { describe, test, expect } from "vitest";
import { Resistor, Capacitor, Inductor, Impedance, IdealCurrentSource, IdealVoltageSource } from "./TwoTerminalComponent";
import { SIPrefix } from "./SIUnits";
import { abs, complex, divide, multiply } from "mathjs";
import type { Complex } from "mathjs";

describe("TwoTerminalComponent", () => {
  test("simple series", () => {
    const r1 = new Resistor('R1', 100);
    const e1 = new IdealVoltageSource('E1', 12);
    const circuit = e1.flip().inSeriesWith(r1);
    circuit.applyVoltage(0, 0, true);
    const v = r1.voltage!;
    const i = r1.current!;
    expect(v).toBeCloseTo(12, 6);
    expect(i).toBeCloseTo(12 / 100, 6);
  });

  test("simple parallel", () => {
    const r1 = new Resistor('R1', 100);
    const r2 = new Resistor('R2', 400);
    const e1 = new IdealVoltageSource('E1', 100);
    const circuit = e1.flip().inSeriesWith(r1.inParallelWith(r2));
    circuit.applyVoltage(0, 0, true);
    const i = circuit.current!;
    const v = r1.voltage!;
    expect(i).toBeCloseTo(100 * (1 / 100 + 1 / 400), 6);
    expect(v).toBeCloseTo(100, 6);
  });

  test("simple rlc", () => {
    const omega = 1e4;
    const r = new Resistor('R', 100);
    const l = new Inductor('L', 1, SIPrefix.Milli);
    const c = new Capacitor('C', 1, SIPrefix.Micro);
    const e = new IdealVoltageSource('E', 12);
    const circuit = e.flip().inSeriesWith(r).inSeriesWith(l).inSeriesWith(c);
    circuit.applyVoltage(0, omega);
    const expected = divide(12, complex(100, -90)) as Complex;
    const actual = circuit.current!;
    expect((actual as Complex).re).toBeCloseTo(expected.re, 6);
    expect((actual as Complex).im).toBeCloseTo(expected.im, 6);
    const lvoltage = l.voltage!;
    const expectedL = multiply(complex(0, omega * 0.001), actual) as Complex;
    expect((lvoltage as Complex).re).toBeCloseTo(expectedL.re, 6);
    expect((lvoltage as Complex).im).toBeCloseTo(expectedL.im, 6);
  });

  test("complex reactive free circuit", () => {
    const r1 = new Resistor('R1', 200);
    const r2 = new Resistor('R2', 100);
    const r3 = new Resistor('R3', 100);
    const r4 = new Resistor('R4', 50);
    const r5 = new Resistor('R5', 100);
    const e1 = new IdealVoltageSource('E1', 1);
    const j1 = new IdealCurrentSource('J1', 20e-3);
    const j2 = new IdealCurrentSource('J2', 10e-3);
    const b1 = j1.inSeriesWith(r1);
    const b2 = r4.inSeriesWith(e1.flip());
    const b3 = r3.inSeriesWith(b2.inParallelWith(r5)).inSeriesWith(j2);
    const circuit = b1.inParallelWith(r2).inParallelWith(b3);
    circuit.applyCurrent(0, 0);
    expect(r1.current!).toBeCloseTo(20e-3, 6);
    expect(r1.voltage!).toBeCloseTo(4, 6);
    expect(j1.voltage!).toBeCloseTo(-7, 6);
    expect(r2.current!).toBeCloseTo(-30e-3, 6);
    expect(r2.voltage!).toBeCloseTo(-3, 6);
    expect(r3.current!).toBeCloseTo(10e-3, 6);
    expect(r3.voltage!).toBeCloseTo(1, 6);
    expect(r4.current!).toBeCloseTo(40e-3 / 3, 6);
    expect(r4.voltage!).toBeCloseTo(2 / 3, 6);
    expect(e1.current!).toBeCloseTo(-40e-3 / 3, 6);
    expect(r5.current!).toBeCloseTo(-10e-3 / 3, 6);
    expect(r5.voltage!).toBeCloseTo(-1 / 3, 6);
    expect(j2.voltage!).toBeCloseTo(-11 / 3, 6);
    const components = Array.from(circuit).map(c => c.label).sort();
    expect(components).toEqual(['E1', 'J1', 'J2', 'R1', 'R2', 'R3', 'R4', 'R5']);
  });

  test("mitic 7.28", () => {
    const x_c = new Impedance('X_C', complex(0, -4));
    const x_l1 = new Impedance('X_L1', complex(0, 2));
    const x_l2 = new Impedance('X_L2', complex(0, 2));
    const r1 = new Resistor('R1', 5);
    const r2 = new Resistor('R2', 5);
    const e1 = new IdealVoltageSource('E1', 10);
    const circuit = e1.flip().inSeriesWith(x_l1).inSeriesWith(r1.inParallelWith(x_c.inSeriesWith(x_l2.inParallelWith(r2))));
    
    circuit.applyVoltage(0);
    
    const e1Current = e1.current!
    const r2Current = r2.current!
    
    const I1_2 = divide(e1Current, r2Current) as Complex;
    expect(abs(I1_2)).toBeCloseTo(3.3, 1);
    expect(I1_2.toPolar().phi).toBeCloseTo(Math.PI / 2, 1);
  });
}); 