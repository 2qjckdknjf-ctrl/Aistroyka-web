import type { RecurringCadence } from "./recurring-operations.types";

/** ISO week key for weekly dedupe buckets, e.g. 2026-W13 */
export function isoWeekPeriodKey(d: Date = new Date()): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((t.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}

/** Day bucket for daily cadence dedupe */
export function utcDayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export function dedupePeriodKey(cadence: RecurringCadence, cadenceDays: number | null): string {
  if (cadence === "daily") return utcDayKey();
  if (cadence === "weekly" || (cadence === "every_n_days" && (cadenceDays ?? 7) >= 7)) {
    return isoWeekPeriodKey();
  }
  return utcDayKey();
}

export function computeNextDueAt(
  cadence: RecurringCadence,
  cadenceDays: number | null,
  from: Date = new Date()
): string {
  const next = new Date(from.getTime());
  if (cadence === "daily") {
    next.setUTCDate(next.getUTCDate() + 1);
    return next.toISOString();
  }
  const n = cadence === "weekly" ? 7 : Math.max(1, cadenceDays ?? 7);
  next.setUTCDate(next.getUTCDate() + n);
  return next.toISOString();
}
