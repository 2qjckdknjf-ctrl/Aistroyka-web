export const QUANTITY_ACCEPTANCE_DECISIONS = [
  "accepted",
  "rejected",
  "insufficient_basis",
] as const;

export type QuantityAcceptanceDecision = (typeof QUANTITY_ACCEPTANCE_DECISIONS)[number];

export function parseQuantityAcceptanceDecision(
  value: unknown
): QuantityAcceptanceDecision | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "accepted" ||
    normalized === "rejected" ||
    normalized === "insufficient_basis"
  ) {
    return normalized;
  }
  return null;
}

/** Accepted quantities may later bind commercial lines (A05); others must not. */
export function isQuantityCommerciallyBindable(
  decision: QuantityAcceptanceDecision | null | undefined
): boolean {
  return decision === "accepted";
}
