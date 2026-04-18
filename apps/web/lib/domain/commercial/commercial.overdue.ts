import type { CommercialItemStatus } from "./commercial.types";

export function todayUtcDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Overdue: stored status, or past due_date while still issued/due. */
export function isEffectivelyOverdue(row: {
  status: CommercialItemStatus;
  due_date: string | null;
}): boolean {
  if (row.status === "overdue") return true;
  if (row.status !== "issued" && row.status !== "due") return false;
  if (!row.due_date) return false;
  return row.due_date < todayUtcDateString();
}
