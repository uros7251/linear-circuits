import { abs, complex, conj, divide, isComplex, isZero, multiply, subtract, unaryMinus } from 'mathjs';
import type { MathNumericType } from 'mathjs';
import { CurrentVoltageCharacteristic } from './CurrentVoltageCharacteristic';
import { getPrefixValue, SIPrefix } from './SIUnits';
import { SolverException, SolverErrorType } from './SolverException';

export const ComponentType = {
  IDEAL_VOLTAGE_SOURCE: 1,
  IDEAL_CURRENT_SOURCE: 2,
  RESISTOR: 3,
  CAPACITOR: 4,
  INDUCTOR: 5,
  IMPEDANCE: 6,
  SERIES: 7,
  PARALLEL: 8,
  AMMETER: 9,
  VOLTMETER: 10,
} as const;
export type ComponentType = typeof ComponentType[keyof typeof ComponentType];

export type ComponentState = [MathNumericType, MathNumericType] | null;

export abstract class TwoTerminalComponent {
  protected _characteristic!: CurrentVoltageCharacteristic;
  protected _state: ComponentState = null;
  protected _forceRecalc: boolean = true;
  public orientation: number = 1;
  public label: string;

  constructor(label: string) {
    this.label = label;
  }

  get state(): ComponentState {
    return this._state;
  }

  get current(): MathNumericType | null {
    return this._state ? this._state[0] : null;
  }

  get voltage(): MathNumericType | null {
    return this._state ? this._state[1] : null;
  }

  get power(): MathNumericType | null {
    if (!this._state) return null;
    return TwoTerminalComponent.computePower(this._state[0], this._state[1]);
  }

  abstract get componentType(): ComponentType;

  *traverse(): Generator<TwoTerminalComponent, void, unknown> {
    yield this;
  }

  protected abstract calculateCurrentVoltageCharacteristic(omega: number): CurrentVoltageCharacteristic;

  needsRecalculation(_omega: number): boolean {
    return this._forceRecalc;
  }

  currentVoltageCharacteristic(omega: number, withOrientation = false): CurrentVoltageCharacteristic {
    if (this.needsRecalculation(omega)) {
      this._characteristic = this.calculateCurrentVoltageCharacteristic(omega);
      this._forceRecalc = false;
    }
    if (withOrientation && this.orientation === -1) {
      return this._characteristic.invert();
    }
    return this._characteristic;
  }

  applyCurrent(current: MathNumericType, omega: number = 0, _recursive: boolean = true): void {
    this._state = [
      current,
      this.currentVoltageCharacteristic(omega).voltageAtCurrent(current),
    ];
  }

  applyVoltage(voltage: MathNumericType, omega: number = 0, _recursive: boolean = true): void {
    this._state = [
      this.currentVoltageCharacteristic(omega).currentAtVoltage(voltage),
      voltage,
    ];
  }

  flip(): this {
    this.orientation = -this.orientation;
    return this;
  }

  inSeriesWith(other: TwoTerminalComponent): TwoTerminalComponent {
    if (other.componentType === ComponentType.SERIES) {
      return (other as Series).inSeriesWith(this);
    }
    return new Series().inSeriesWith(this).inSeriesWith(other);
  }

  inParallelWith(other: TwoTerminalComponent): TwoTerminalComponent {
    if (other.componentType === ComponentType.PARALLEL) {
      return (other as Parallel).inParallelWith(this);
    }
    return new Parallel().inParallelWith(this).inParallelWith(other);
  }

  [Symbol.iterator](): Generator<TwoTerminalComponent, void, unknown> {
    return this.traverse();
  }

  /** Complex apparent power S = V × I* (W + jVAr). Re(S) = active, Im(S) = reactive. */
  static computePower(current: MathNumericType, voltage: MathNumericType): MathNumericType {
    const conjI = isComplex(current) ? conj(current) : current;
    return multiply(voltage, conjI) as MathNumericType;
  }
}

export abstract class RealValuedTwoTerminalComponent extends TwoTerminalComponent {
  public value!: number;

  constructor(label: string, value: number, unit: SIPrefix = SIPrefix.Nil) {
    super(label);
    this.setValue(value * getPrefixValue(unit), label);
  }

  protected setValue(val: number, label: string) {
    if (val < 0) {
      throw new Error(`${label} cannot be negative.`);
    }
    this.value = val;
    this._forceRecalc = true;
  }
}

export abstract class ReactiveComponent extends RealValuedTwoTerminalComponent {
  private _cachedOmega: number = 0;

  needsRecalculation(omega: number): boolean {
    return this._forceRecalc || this._cachedOmega !== omega;
  }

  protected calculateCurrentVoltageCharacteristic(omega: number): CurrentVoltageCharacteristic {
    this._cachedOmega = omega;
    return this.calculateReactiveCharacteristic(omega);
  }

  protected abstract calculateReactiveCharacteristic(omega: number): CurrentVoltageCharacteristic;
}

export abstract class ComplexValuedTwoTerminalComponent extends TwoTerminalComponent {
  private _value!: MathNumericType;

  get value(): MathNumericType {
    return this._value;
  }

  set value(v: MathNumericType) {
    this._value = v;
    this._forceRecalc = true;
  }

  constructor(label: string, value: MathNumericType, unit: SIPrefix = SIPrefix.Nil) {
    super(label);
    this.value = multiply(value, getPrefixValue(unit)) as MathNumericType;
  }
}

export abstract class CompositeTwoTerminalComponent extends TwoTerminalComponent {
  public components: TwoTerminalComponent[] = [];

  constructor(label: string) {
    super(label);
  }

  *traverse(): Generator<TwoTerminalComponent, void, unknown> {
    for (const component of this.components) {
      yield* component.traverse();
    }
  }

  needsRecalculation(omega: number): boolean {
    return super.needsRecalculation(omega) || this.components.some(c => c.needsRecalculation(omega));
  }

  protected addComponent(component: TwoTerminalComponent): this {
    this.components.push(component);
    return this;
  }

  protected removeComponent(component: TwoTerminalComponent): this {
    this.components = this.components.filter(c => c !== component);
    return this;
  }

  protected partition(predicate: (c: TwoTerminalComponent) => boolean): [TwoTerminalComponent[], TwoTerminalComponent[]] {
    const pass: TwoTerminalComponent[] = [];
    const fail: TwoTerminalComponent[] = [];
    for (const component of this.components) {
      (predicate(component) ? pass : fail).push(component);
    }
    return [pass, fail];
  }
}

export class Resistor extends RealValuedTwoTerminalComponent {
  get resistance(): number { return this.value; }
  set resistance(v: number) { this.setValue(v, 'Resistance'); }

  get componentType(): ComponentType { return ComponentType.RESISTOR; }

  calculateCurrentVoltageCharacteristic(_omega: number): CurrentVoltageCharacteristic {
    if (this.value < 1e-12) return CurrentVoltageCharacteristic.shortCircuit();
    return new CurrentVoltageCharacteristic(1, 1 / this.value, 0);
  }
}

export class Capacitor extends ReactiveComponent {
  get capacitance(): number { return this.value; }
  set capacitance(v: number) { this.setValue(v, 'Capacitance'); }

  get componentType(): ComponentType { return ComponentType.CAPACITOR; }

  protected calculateReactiveCharacteristic(omega: number): CurrentVoltageCharacteristic {
    const y = complex(0, omega * this.value);
    return omega === 0 ? CurrentVoltageCharacteristic.openCircuit() : new CurrentVoltageCharacteristic(1, y, 0);
  }
}

export class Inductor extends ReactiveComponent {
  get inductance(): number { return this.value; }
  set inductance(v: number) { this.setValue(v, 'Inductance'); }

  get componentType(): ComponentType { return ComponentType.INDUCTOR; }

  protected calculateReactiveCharacteristic(omega: number): CurrentVoltageCharacteristic {
    const x = omega * this.value;
    if (x < 1e-12) return CurrentVoltageCharacteristic.shortCircuit();
    return new CurrentVoltageCharacteristic(1, complex(0, -1 / x), 0);
  }
}

export class Impedance extends ComplexValuedTwoTerminalComponent {
  get impedance(): MathNumericType { return this.value; }
  set impedance(v: MathNumericType) { this.value = v; }

  get componentType(): ComponentType { return ComponentType.IMPEDANCE; }

  calculateCurrentVoltageCharacteristic(_omega: number): CurrentVoltageCharacteristic {
    if ((abs(this.value) as number) < 1e-12) return CurrentVoltageCharacteristic.shortCircuit();
    return new CurrentVoltageCharacteristic(1, divide(1, this.value) as MathNumericType, 0);
  }
}

export class IdealVoltageSource extends ComplexValuedTwoTerminalComponent {
  get emf(): MathNumericType { return this.value; }
  set emf(v: MathNumericType) { this.value = v; }

  get componentType(): ComponentType { return ComponentType.IDEAL_VOLTAGE_SOURCE; }

  calculateCurrentVoltageCharacteristic(_omega: number): CurrentVoltageCharacteristic {
    return new CurrentVoltageCharacteristic(0, 1, unaryMinus(this.value));
  }
}

export class IdealCurrentSource extends ComplexValuedTwoTerminalComponent {
  get amperage(): MathNumericType { return this.value; }
  set amperage(v: MathNumericType) { this.value = v; }

  get componentType(): ComponentType { return ComponentType.IDEAL_CURRENT_SOURCE; }

  calculateCurrentVoltageCharacteristic(_omega: number): CurrentVoltageCharacteristic {
    return new CurrentVoltageCharacteristic(1, 0, this.value);
  }
}

export class Ammeter extends IdealVoltageSource {
  constructor(label: string) { super(label, 0); }
  get componentType(): ComponentType { return ComponentType.AMMETER; }
}

export class Voltmeter extends IdealCurrentSource {
  constructor(label: string) { super(label, 0); }
  get componentType(): ComponentType { return ComponentType.VOLTMETER; }
}

export class Series extends CompositeTwoTerminalComponent {
  constructor(label: string = 'Series') {
    super(label);
  }

  get componentType(): ComponentType { return ComponentType.SERIES; }

  calculateCurrentVoltageCharacteristic(omega: number): CurrentVoltageCharacteristic {
    const [fixedCurrentComponents, otherComponents] = this.partition(
      c => c.currentVoltageCharacteristic(omega).hasFixedCurrent,
    );
    switch (fixedCurrentComponents.length) {
      case 0:
        return otherComponents.reduce(
          (char, c) => char.inSeries(c.currentVoltageCharacteristic(omega, true)),
          CurrentVoltageCharacteristic.shortCircuit(),
        );
      case 1:
        return fixedCurrentComponents[0].currentVoltageCharacteristic(omega, true);
      default:
        throw new SolverException(
          SolverErrorType.CONFLICTING_SOURCES,
          'Two or more current sources connected in series',
          fixedCurrentComponents.map(c => c.label),
        );
    }
  }

  applyCurrent(current: MathNumericType, omega: number = 0, recursive: boolean = true): void {
    if (!isZero(current) && this.currentVoltageCharacteristic(omega).hasFixedCurrent) {
      throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Cannot apply current to a fixed-current component',
        this.components.filter(c => c.currentVoltageCharacteristic(omega).hasFixedCurrent).map(c => c.label),
      );
    }
    super.applyCurrent(current, omega, recursive);
    if (!recursive) return;
    for (const component of this.components) {
      const orientatedCurrent = multiply(current, component.orientation) as MathNumericType;
      component.applyCurrent(orientatedCurrent, omega, recursive);
    }
  }

  applyVoltage(voltage: MathNumericType, omega: number = 0, recursive: boolean = true): void {
    this.currentVoltageCharacteristic(omega);
    const [fixedCurrentComponents, otherComponents] = this.partition(
      c => c.currentVoltageCharacteristic(omega).hasFixedCurrent,
    );
    super.applyVoltage(voltage, omega, recursive);
    if (!recursive) return;
    let remainingVoltage = voltage;
    for (const component of otherComponents) {
      const orientatedCurrent = multiply(this.current!, component.orientation) as MathNumericType;
      component.applyCurrent(orientatedCurrent, omega, recursive);
      const componentVoltage = multiply(component.voltage!, component.orientation) as MathNumericType;
      remainingVoltage = subtract(remainingVoltage, componentVoltage) as MathNumericType;
    }
    if (fixedCurrentComponents.length === 1) {
      const fixedVoltage = multiply(remainingVoltage, fixedCurrentComponents[0].orientation) as MathNumericType;
      fixedCurrentComponents[0].applyVoltage(fixedVoltage, omega, recursive);
    }
  }

  inSeriesWith(other: TwoTerminalComponent): this {
    if (other.componentType === ComponentType.SERIES) {
      const otherSeries = other as Series;
      const flip = this.orientation !== other.orientation;
      for (const component of otherSeries.components) {
        if (flip) component.flip();
        this.addComponent(component);
      }
    } else {
      this.addComponent(other);
    }
    return this;
  }
}

export class Parallel extends CompositeTwoTerminalComponent {
  constructor(label: string = 'Parallel') {
    super(label);
  }

  get componentType(): ComponentType { return ComponentType.PARALLEL; }

  calculateCurrentVoltageCharacteristic(omega: number): CurrentVoltageCharacteristic {
    const [fixedVoltageComponents, otherComponents] = this.partition(
      c => c.currentVoltageCharacteristic(omega).hasFixedVoltage,
    );
    switch (fixedVoltageComponents.length) {
      case 0:
        return otherComponents.reduce(
          (char, c) => char.inParallel(c.currentVoltageCharacteristic(omega, true)),
          CurrentVoltageCharacteristic.openCircuit(),
        );
      case 1:
        return fixedVoltageComponents[0].currentVoltageCharacteristic(omega, true);
      default:
        throw new SolverException(
          SolverErrorType.CONFLICTING_SOURCES,
          'Two or more voltage sources connected in parallel',
          fixedVoltageComponents.map(c => c.label),
        );
    }
  }

  applyCurrent(current: MathNumericType, omega: number = 0, recursive: boolean = true): void {
    this.currentVoltageCharacteristic(omega);
    const [fixedVoltageComponents, otherComponents] = this.partition(
      c => c.currentVoltageCharacteristic(omega).hasFixedVoltage,
    );
    super.applyCurrent(current, omega, recursive);
    if (!recursive) return;
    let remainingCurrent = current;
    for (const component of otherComponents) {
      const orientatedVoltage = multiply(this.voltage!, component.orientation) as MathNumericType;
      component.applyVoltage(orientatedVoltage, omega);
      const componentCurrent = multiply(component.current!, component.orientation) as MathNumericType;
      remainingCurrent = subtract(remainingCurrent, componentCurrent) as MathNumericType;
    }
    if (fixedVoltageComponents.length === 1) {
      const fixedCurrent = multiply(remainingCurrent, fixedVoltageComponents[0].orientation) as MathNumericType;
      fixedVoltageComponents[0].applyCurrent(fixedCurrent, omega, recursive);
    }
  }

  applyVoltage(voltage: MathNumericType, omega: number = 0, recursive: boolean = true): void {
    if (this.currentVoltageCharacteristic(omega).hasFixedVoltage) {
      throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Cannot apply voltage to a fixed-voltage component',
        this.components.filter(c => c.currentVoltageCharacteristic(omega).hasFixedVoltage).map(c => c.label),
      );
    }
    super.applyVoltage(voltage, omega, recursive);
    if (!recursive) return;
    for (const component of this.components) {
      const orientatedVoltage = multiply(voltage, component.orientation) as MathNumericType;
      component.applyVoltage(orientatedVoltage, omega, recursive);
    }
  }

  inParallelWith(other: TwoTerminalComponent): this {
    if (other.componentType === ComponentType.PARALLEL) {
      const otherParallel = other as Parallel;
      const flip = this.orientation !== other.orientation;
      for (const component of otherParallel.components) {
        if (flip) component.flip();
        this.addComponent(component);
      }
    } else {
      this.addComponent(other);
    }
    return this;
  }
}
