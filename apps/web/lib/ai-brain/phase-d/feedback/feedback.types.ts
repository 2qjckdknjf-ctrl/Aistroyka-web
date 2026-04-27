/**
 * AI Brain Phase D — Structured feedback types.
 */

export const FEEDBACK_SOURCE_KINDS = ["human", "system", "test"] as const;
export type FeedbackSourceKind = (typeof FEEDBACK_SOURCE_KINDS)[number];

export const FEEDBACK_CATEGORIES = [
  "factuality",
  "usefulness",
  "safety",
  "role_fit",
  "completeness",
  "action_relevance",
  "memory_relevance",
  "degradation_quality",
] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

/** Score 0–5. */
export type FeedbackScore = 0 | 1 | 2 | 3 | 4 | 5;

export interface AiFeedbackRecord {
  id: string;
  runRecordId: string;
  tenantId: string;
  sourceKind: FeedbackSourceKind;
  reviewerRole: string | null;
  feedbackCategory: FeedbackCategory;
  factualityScore: FeedbackScore | null;
  usefulnessScore: FeedbackScore | null;
  safetyScore: FeedbackScore | null;
  roleFitScore: FeedbackScore | null;
  completenessScore: FeedbackScore | null;
  comments: string | null;
  linkedRefs: LinkedRef[];
  createdAt: string;
}

export interface LinkedRef {
  type: "action" | "output" | "memory" | "run";
  ref: string;
}

export interface CreateFeedbackInput {
  runId: string;
  tenantId: string;
  sourceKind: FeedbackSourceKind;
  reviewerRole?: string | null;
  feedbackCategory: FeedbackCategory;
  factualityScore?: FeedbackScore | number | null;
  usefulnessScore?: FeedbackScore | number | null;
  safetyScore?: FeedbackScore | number | null;
  roleFitScore?: FeedbackScore | number | null;
  completenessScore?: FeedbackScore | number | null;
  comments?: string | null;
  linkedRefs?: LinkedRef[];
}
