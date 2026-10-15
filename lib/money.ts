import { Prisma } from "@prisma/client";

export type Dec = Prisma.Decimal;
export const Decimal = Prisma.Decimal;
export type DecInput = Prisma.Decimal | string | number | null | undefined;

export const ZERO = new Decimal(0);

/** Convert any numeric input to an exact Decimal (null/undefined → 0). */
export function D(v: DecInput): Dec {
  if (v === null || v === undefined || v === "") return ZERO;
  return v instanceof Decimal ? v : new Decimal(v);
}

export function sum(values: DecInput[]): Dec {
  return values.reduce<Dec>((acc, v) => acc.plus(D(v)), ZERO);
}

/** Round half-up to 2 decimal places (money). */
export function round2(v: DecInput): Dec {
  return D(v).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function min(a: Dec, b: Dec): Dec {
  return a.lessThan(b) ? a : b;
}
export function max(a: Dec, b: Dec): Dec {
  return a.greaterThan(b) ? a : b;
}

/** Percentage (0–100, 2dp) of earned over possible; 0 when nothing is possible. */
export function percentage(earned: DecInput, possible: DecInput): Dec {
  const p = D(possible);
  if (p.lessThanOrEqualTo(0)) return ZERO;
  return round2(D(earned).dividedBy(p).times(100));
}

/**
 * Split `total` into `parts` installments that sum exactly to total
 * (remainder paise go to the earliest installments).
 */
export function splitAmount(total: DecInput, parts: number): Dec[] {
  if (parts < 1) throw new Error("parts must be >= 1");
  const t = round2(total);
  const cents = t.times(100).toDecimalPlaces(0);
  const base = cents.dividedToIntegerBy(parts);
  const remainder = cents.minus(base.times(parts)).toNumber();
  return Array.from({ length: parts }, (_, i) =>
    base.plus(i < remainder ? 1 : 0).dividedBy(100),
  );
}

export function money(v: DecInput): string {
  return round2(v).toFixed(2);
}

export function formatINR(v: DecInput): string {
  const n = round2(v);
  const [intPart, frac] = n.abs().toFixed(2).split(".");
  // Indian digit grouping: last three digits, then groups of two.
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + last3 : last3;
  return `${n.isNegative() ? "-" : ""}₹${grouped}.${frac}`;
}
