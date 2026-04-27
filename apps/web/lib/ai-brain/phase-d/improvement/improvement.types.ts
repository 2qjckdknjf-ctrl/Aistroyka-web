/**
 * AI Brain Phase D — Improvement candidate types.
 */

export const IMPROVEMENT_SOURCES = ["feedback", "eval", "manual"] as const;
export type ImprovementSource = (typeof IMPROVEMENT_SOURCES)[number];

export const TARGET_LAYERS = [
  "prompt",
  "policy",
  "planner",
  "tooling",
  "output",
  "memory_retrieval",
] as const;
export type TargetLayer = (typeof TARGET_LAYERS)[number];

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface LinkedEvidenceRef {
  type: "feedback" | "eval" | "run";
  id: string;
}

export interface AiImprovementCandidate {
  id: string;
  tenantId: string | null;
  source: ImprovementSource;
  targetLayer: TargetLayer;
  rationale: string;
  expectedGain: string | null;
  risk: string | null;
  readiness: string;
  reviewStatus: ReviewStatus;
  linkedEvidenceRefs: LinkedEvidenceRef[];
  createdAt: string;
}

export interface CreateImprovementCandidateInput {
  tenantId?: string | null;
  source: ImprovementSource;
  targetLayer: TargetLayer;
  rationale: string;
  expectedGain?: string | null;
  risk?: string | null;
  readiness?: string;
  linkedEvidenceRefs?: LinkedEvidenceRef[];
}
