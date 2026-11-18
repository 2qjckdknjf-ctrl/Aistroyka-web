/** Exact arithmetic. Geometry/coverage and price denominators are never rounded mid-calculation. */
export type Rational = Readonly<{ n: bigint; d: bigint }>;
const ZERO = BigInt(0), ONE = BigInt(1), TEN = BigInt(10);
export const zero: Rational = { n: ZERO, d: ONE };
export const one: Rational = { n: ONE, d: ONE };
function gcd(a: bigint, b: bigint): bigint {
  a = a < ZERO ? -a : a;
  while (b !== ZERO) { const next = a % b; a = b; b = next; }
  return a;
}
export function rational(n: bigint, d = ONE): Rational {
  if (d === ZERO) throw new Error("Zero denominator");
  if (d < ZERO) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
export const add = (a: Rational, b: Rational) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational) => rational(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational) => rational(a.n * b.d, a.d * b.n);
export const cmp = (a: Rational, b: Rational) => a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
export const half = (a: Rational) => rational(a.n, a.d * BigInt(2));
export const key = (a: Rational) => `${a.n}/${a.d}`;
export function decimal(value: string): Rational {
  if (typeof value !== "string" || value.length > 40 || !/^-?(0|[1-9][0-9]*)(\.[0-9]{1,9})?$/.test(value)) {
    throw new Error("Invalid canonical decimal");
  }
  const [whole, fraction = ""] = value.split(".");
  const magnitude = BigInt(whole.replace("-", "") + fraction);
  return rational(value.startsWith("-") ? -magnitude : magnitude, TEN ** BigInt(fraction.length));
}
export function roundHalfUp(value: Rational, places: number): string {
  if (!Number.isInteger(places) || places < 0 || places > 9) throw new Error("Invalid precision");
  const scale = TEN ** BigInt(places);
  const negative = value.n < ZERO;
  const absolute = negative ? -value.n : value.n;
  const scaled = absolute * scale;
  let integer = scaled / value.d;
  if ((scaled % value.d) * BigInt(2) >= value.d) integer += ONE;
  const text = integer.toString().padStart(places + 1, "0");
  const sign = negative && integer !== ZERO ? "-" : "";
  return sign + (places ? text.slice(0, -places) + "." + text.slice(-places) : text);
}
export function ceilNonnegative(value: Rational): bigint {
  if (value.n < ZERO) throw new Error("Negative quantity");
  return value.n / value.d + (value.n % value.d === ZERO ? ZERO : ONE);
}

/** Intake adapter only; thousands separators/unknown units are deliberately rejected. */
export function normalizeLength(value: string, unit: string): string {
  if (!["m", "cm", "mm"].includes(unit)) throw new Error("Unknown length unit");
  const parsed = decimal(value.trim().replace(",", "."));
  if (cmp(parsed, zero) < 0) throw new Error("Negative length");
  const meters = div(parsed, decimal(unit === "m" ? "1" : unit === "cm" ? "100" : "1000"));
  // Input snapshots support 9 places; a sub-resolution measurement must not vanish.
  const normalized = roundHalfUp(meters, 9);
  if (cmp(decimal(normalized), meters) !== 0) throw new Error("Length below input precision");
  return normalized;
}

/** amountMinor / source coverage stays rational until the whole line is rounded. */
export function priceLineTotalMinor(amountMinor: string, coverage: string, quantity: string): string {
  if (!/^(0|[1-9][0-9]{0,29})$/.test(amountMinor)) throw new Error("Invalid minor amount");
  const denominator = decimal(coverage), q = decimal(quantity);
  if (cmp(denominator, zero) <= 0 || cmp(q, zero) < 0) throw new Error("Invalid rate coverage or quantity");
  return roundHalfUp(mul(div(rational(BigInt(amountMinor)), denominator), q), 0);
}

/** Legacy calc.v1 accepts a safe integer unit cost; never approximate an exact new rate. */
export function legacyUnitCostMinor(amountMinor: string, coverage: string): {
  unit_cost_minor: number | null; issue: "precision_loss" | "invalid_input" | null;
} {
  try {
    if (!/^(0|[1-9][0-9]{0,29})$/.test(amountMinor)) throw new Error("Invalid amount");
    const denominator = decimal(coverage);
    if (cmp(denominator, zero) <= 0) throw new Error("Invalid coverage");
    const rate = div(rational(BigInt(amountMinor)), denominator);
    if (rate.d !== ONE || rate.n > BigInt(Number.MAX_SAFE_INTEGER)) {
      return { unit_cost_minor: null, issue: "precision_loss" };
    }
    return { unit_cost_minor: Number(rate.n), issue: null };
  } catch {
    return { unit_cost_minor: null, issue: "invalid_input" };
  }
}
