import type { MathNumericType } from 'mathjs';
import { getPrefixValue, getPrefixSymbol, DISPLAY_PREFIXES } from '../solver/SIUnits';

const SI_PREFIXES: [number, string][] = DISPLAY_PREFIXES.map(
  p => [getPrefixValue(p), getPrefixSymbol(p)!],
);

/** Format a MathNumericType to a compact string with 3 significant figures. */
export function formatValue(v: MathNumericType): string {
  if (typeof v === 'object' && v !== null && 're' in v) {
    const c = v as { re: number; im: number };
    const re = toPrecision3(c.re);
    const im = Math.abs(c.im);
    if (im < 1e-9) return re;
    const sign = c.im >= 0 ? '+' : '−';
    return `${re}${sign}${toPrecision3(im)}j`;
  }
  return toPrecision3(Number(v));
}

/**
 * Format a MathNumericType with an SI-prefixed unit (e.g. 0.001 A → "1 mA").
 * The prefix is chosen based on the magnitude of the value.
 */
export function formatWithUnit(v: MathNumericType, unit: string): string {
  if (typeof v === 'object' && v !== null && 're' in v) {
    const c = v as { re: number; im: number };
    const magnitude = Math.sqrt(c.re * c.re + c.im * c.im);
    const [scale, prefix] = pickPrefix(magnitude);
    const reStr = toPrecision3(c.re / scale);
    const imScaled = c.im / scale;
    if (Math.abs(imScaled) < 1e-9) return `${reStr} ${prefix}${unit}`;
    const sign = imScaled >= 0 ? '+' : '−';
    return `${reStr}${sign}${toPrecision3(Math.abs(imScaled))}j ${prefix}${unit}`;
  }
  const n = Number(v);
  const [scale, prefix] = pickPrefix(Math.abs(n));
  return `${toPrecision3(n / scale)} ${prefix}${unit}`;
}


function pickPrefix(magnitude: number): [number, string] {
  if (magnitude < 1e-13) return [1, ''];
  for (const [scale, prefix] of SI_PREFIXES) {
    if (magnitude >= scale) return [scale, prefix];
  }
  return [1e-12, 'p'];
}

function toPrecision3(n: number): string {
  if (Math.abs(n) < 1e-9) return '0';
  return parseFloat(n.toPrecision(3)).toString();
}

/** Serialize {re, im} to a human-editable string: "1", "2j", "1+2j", "1-2j". */
export function complexToString(re: number, im: number): string {
  if (im === 0) return String(re);
  if (re === 0) {
    if (im === 1) return 'j';
    if (im === -1) return '-j';
    return `${im}j`;
  }
  if (im === 1) return `${re}+j`;
  if (im === -1) return `${re}-j`;
  return im > 0 ? `${re}+${im}j` : `${re}${im}j`;
}

/**
 * Parse a user-typed complex number string.
 * Accepts: "3", "-3", "3j", "-j", "j", "3+4j", "3-4j", "3+j", "3-j".
 * Returns null on invalid input.
 */
export function parseComplexInput(input: string): { re: number; im: number } | null {
  const s = input.replace(/\s/g, '');
  if (!s) return null;

  const N = '(?:\\d+\\.?\\d*|\\.\\d+)';

  // Full: a±bj or a±j  e.g. "3+4j", "-3-j"
  let m = new RegExp(`^([+-]?${N})([+-])(${N})?j$`).exec(s);
  if (m) {
    const sign = m[2] === '-' ? -1 : 1;
    const im = m[3] ? Number(m[3]) * sign : sign;
    return { re: Number(m[1]), im };
  }

  // Pure imaginary: ±Nj or ±j or Nj  e.g. "4j", "-j", "j"
  m = new RegExp(`^([+-]?)(${N})?j$`).exec(s);
  if (m) {
    const sign = m[1] === '-' ? -1 : 1;
    const im = m[2] ? Number(m[2]) * sign : sign;
    return { re: 0, im };
  }

  // Pure real: e.g. "3", "-3.14"
  m = new RegExp(`^([+-]?${N})$`).exec(s);
  if (m) return { re: Number(m[1]), im: 0 };

  return null;
}
