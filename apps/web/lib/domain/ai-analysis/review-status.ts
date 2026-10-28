/**
 * Human review contract for durable ai_analysis rows.
 * Pending/rejected/insufficient are never Graph-eligible; customers never see this surface.
 */

export const AI_ANALYSIS_REVIEW_STATUSES = [
  "pending",
  "accepted",
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
    normalized === "rejected" ||
    normalized === "insufficient_evidence"
  ) {
    return normalized;
  }
  return null;
}

/** Only accepted human verdicts may promote into Construction Graph lineage. */
export function isAiAnalysisGraphEligible(status: AiAnalysisReviewStatus | null | undefined): boolean {
  return status === "accepted";
}

export function assertAiAnalysisGraphEligible(
  status: AiAnalysisReviewStatus | null | undefined
): asserts status is "accepted" {
  if (!isAiAnalysisGraphEligible(status)) {
    throw new Error("AI_ANALYSIS_NOT_GRAPH_ELIGIBLE");
  }
}
