export const SIPrefix = {
  Yotta: 1,
  Zetta: 2,
  Exa: 3,
  Peta: 4,
  Tera: 5,
  Giga: 6,
  Mega: 7,
  Kilo: 8,
  Nil: 9,
  Milli: 10,
  Micro: 11,
  Nano: 12,
  Pico: 13,
  Femto: 14,
  Atto: 15,
  Zepto: 16,
  Yocto: 17,
} as const;

export type SIPrefix = typeof SIPrefix[keyof typeof SIPrefix];

const prefixValues: Record<SIPrefix, number> = {
  [SIPrefix.Yotta]: 1e24,
  [SIPrefix.Zetta]: 1e21,
  [SIPrefix.Exa]: 1e18,
  [SIPrefix.Peta]: 1e15,
  [SIPrefix.Tera]: 1e12,
  [SIPrefix.Giga]: 1e9,
  [SIPrefix.Mega]: 1e6,
  [SIPrefix.Kilo]: 1e3,
  [SIPrefix.Nil]: 1,
  [SIPrefix.Milli]: 1e-3,
  [SIPrefix.Micro]: 1e-6,
  [SIPrefix.Nano]: 1e-9,
  [SIPrefix.Pico]: 1e-12,
  [SIPrefix.Femto]: 1e-15,
  [SIPrefix.Atto]: 1e-18,
  [SIPrefix.Zepto]: 1e-21,
  [SIPrefix.Yocto]: 1e-24,
};

export function getPrefixValue(prefix: SIPrefix): number {
  return prefixValues[prefix];
}

const prefixSymbols: Partial<Record<SIPrefix, string>> = {
  [SIPrefix.Tera]: 'T',
  [SIPrefix.Giga]: 'G',
  [SIPrefix.Mega]: 'M',
  [SIPrefix.Kilo]: 'k',
  [SIPrefix.Nil]: '',
  [SIPrefix.Milli]: 'm',
  [SIPrefix.Micro]: 'μ',
  [SIPrefix.Nano]: 'n',
  [SIPrefix.Pico]: 'p',
};

export function getPrefixSymbol(prefix: SIPrefix): string | undefined {
  return prefixSymbols[prefix];
}

/** Prefixes shown in UI dropdowns and formatted output, largest first. */
export const DISPLAY_PREFIXES = [
  SIPrefix.Tera, SIPrefix.Giga, SIPrefix.Mega, SIPrefix.Kilo,
  SIPrefix.Nil,
  SIPrefix.Milli, SIPrefix.Micro, SIPrefix.Nano, SIPrefix.Pico,
] as const;
