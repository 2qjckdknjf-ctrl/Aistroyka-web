/**
 * Human review contract for durable ai_analysis rows.
 * Pending/rejected/insufficient are never Graph-eligible; customers never see this surface.
 * `edited` = accepted-with-edits (graph-eligible) with correction provenance (AIS-CORRECTION-009).
 */

export const AI_ANALYSIS_REVIEW_STATUSES = [
  "pending",
  "accepted",
  "edited",
  "rejected",
  "insufficient_evidence",
] as const;

export type AiAnalysisReviewStatus = (typeof AI_ANALYSIS_REVIEW_STATUSES)[number];

export function parseAiAnalysisReviewStatus(value: unknown): AiAnalysisReviewStatus | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "pending" ||
    normalized === "accepted" ||
    normalized === "edited" ||
    normalized === "rejected" ||
    normalized === "insufficient_evidence"
  ) {
    return normalized;
  }
  return null;
}

/** Accepted and edited (accepted-with-edits) may promote into Construction Graph lineage. */
export function isAiAnalysisGraphEligible(status: AiAnalysisReviewStatus | null | undefined): boolean {
  return status === "accepted" || status === "edited";
}

export function assertAiAnalysisGraphEligible(
  status: AiAnalysisReviewStatus | null | undefined
): asserts status is "accepted" | "edited" {
  if (!isAiAnalysisGraphEligible(status)) {
    throw new Error("AI_ANALYSIS_NOT_GRAPH_ELIGIBLE");
  }
}
