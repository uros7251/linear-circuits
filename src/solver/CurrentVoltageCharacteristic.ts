import { add, divide, isZero, multiply, subtract, unaryMinus } from 'mathjs';
import type { MathNumericType } from 'mathjs';
import { SolverException, SolverErrorType } from './SolverException';

export class CurrentVoltageCharacteristic {
  // aI = yV + c
  a: number;
  y: MathNumericType;
  c: MathNumericType;

  constructor(a: number, y: MathNumericType, c: MathNumericType) {
    this.a = a;
    this.y = y;
    this.c = c;
  }

  toString(): string {
    if (this.hasFixedCurrent) {
      return `I = ${this.c.toString()}`;
    } else if (this.hasFixedVoltage) {
      return `V = ${(unaryMinus(divide(this.c, this.y))).toString()}`;
    }
    return `I = (${this.y.toString()})V + ${this.c.toString()}`;
  }

  get hasFixedCurrent(): boolean {
    return this.a === 1 && isZero(this.y);
  }

  get hasFixedVoltage(): boolean {
    return this.a === 0;
  }

  get isShortCircuit(): boolean {
    return this.a === 0 && this.y === 1 && isZero(this.c);
  }

  get isOpenCircuit(): boolean {
    return this.a === 1 && isZero(this.y) && isZero(this.c);
  }

  get admittanceCoefficient(): MathNumericType {
    return this.y;
  }

  get freeCoefficient(): MathNumericType {
    return this.c;
  }

  currentAtVoltage(voltage: MathNumericType): MathNumericType {
    // Short-circuit convention: if zero voltage is applied, current is also zero.
    if (isZero(voltage) && this.isShortCircuit) return 0;
    if (this.hasFixedVoltage) {
      if (isZero(voltage)) throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Voltage source short-circuited',
      );
      throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Cannot apply voltage to a fixed-voltage component',
      );
    }
    // I = yV + c
    return add(multiply(this.y, voltage), this.c) as MathNumericType;
  }

  voltageAtCurrent(current: MathNumericType): MathNumericType {
    if (this.hasFixedCurrent) {
      if (this.isOpenCircuit) return 0;
      if (isZero(current)) throw new SolverException(
        SolverErrorType.KCL_VIOLATION,
        'Circuit has no valid solution: current source has no return path',
      );
      throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Cannot apply current to a fixed-current component',
      );
    }
    if (this.hasFixedVoltage) {
      return unaryMinus(divide(this.c, this.y)) as MathNumericType;
    }
    // V = (I - c) / y
    return divide(subtract(current, this.c), this.y) as MathNumericType;
  }

  invert(): CurrentVoltageCharacteristic {
    return new CurrentVoltageCharacteristic(this.a, this.y, unaryMinus(this.c));
  }

  inSeries(other: CurrentVoltageCharacteristic): CurrentVoltageCharacteristic {
    if (!(other instanceof CurrentVoltageCharacteristic)) {
      throw new Error('Both operands of inSeries operation must be CurrentVoltageCharacteristic');
    }
    if (this.hasFixedCurrent && other.hasFixedCurrent) {
      throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Two or more current sources connected in series',
      );
    }
    if (this.hasFixedCurrent) return this;
    if (other.hasFixedCurrent) return other;

    const a = add(multiply(this.y, other.a), multiply(other.y, this.a));
    const c = add(multiply(this.y, other.c), multiply(other.y, this.c));
    const y = multiply(this.y, other.y);
    return isZero(a)
      ? new CurrentVoltageCharacteristic(0, y as MathNumericType, c as MathNumericType)
      : new CurrentVoltageCharacteristic(1, divide(y, a) as MathNumericType, divide(c, a) as MathNumericType);
  }

  inParallel(other: CurrentVoltageCharacteristic): CurrentVoltageCharacteristic {
    if (!(other instanceof CurrentVoltageCharacteristic)) {
      throw new Error('Both operands of inParallel operation must be CurrentVoltageCharacteristic');
    }
    if (this.hasFixedVoltage && other.hasFixedVoltage) {
      throw new SolverException(
        SolverErrorType.CONFLICTING_SOURCES,
        'Two or more voltage sources connected in parallel',
      );
    }
    if (this.hasFixedVoltage) return this;
    if (other.hasFixedVoltage) return other;

    return new CurrentVoltageCharacteristic(
      this.a * other.a,
      add(multiply(this.y, other.a), multiply(other.y, this.a)) as MathNumericType,
      add(multiply(this.c, other.a), multiply(other.c, this.a)) as MathNumericType,
    );
  }

  static shortCircuit(): CurrentVoltageCharacteristic {
    return new CurrentVoltageCharacteristic(0, 1, 0);
  }

  static openCircuit(): CurrentVoltageCharacteristic {
    return new CurrentVoltageCharacteristic(1, 0, 0);
  }
}
