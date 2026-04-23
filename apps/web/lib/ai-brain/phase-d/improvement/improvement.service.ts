/**
 * AI Brain Phase D — Improvement candidate service.
 * Converts eval/feedback findings into explicit, review-gated candidates.
 * No automatic production mutation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { createImprovementCandidate, listImprovementCandidates } from "./improvement.repository";
import { logPhaseDCandidateCreated } from "../telemetry/phase-d-telemetry";
import type {
  CreateImprovementCandidateInput,
  LinkedEvidenceRef,
  ImprovementSource,
  TargetLayer,
} from "./improvement.types";
import { IMPROVEMENT_SOURCES, TARGET_LAYERS } from "./improvement.types";

export type CreateCandidateResult =
  | { success: true; candidateId: string }
  | { success: false; error: string };

export function validateSource(v: unknown): v is ImprovementSource {
  return typeof v === "string" && IMPROVEMENT_SOURCES.includes(v as ImprovementSource);
}

export function validateTargetLayer(v: unknown): v is TargetLayer {
  return typeof v === "string" && TARGET_LAYERS.includes(v as TargetLayer);
}

export function validateLinkedEvidenceRefs(v: unknown): LinkedEvidenceRef[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is LinkedEvidenceRef => {
    if (typeof x !== "object" || x == null) return false;
    const o = x as Record<string, unknown>;
    return (
      (o.type === "feedback" || o.type === "eval" || o.type === "run") &&
      typeof o.id === "string"
    );
  });
}

export async function createCandidate(
  supabase: SupabaseClient,
  input: CreateImprovementCandidateInput
): Promise<CreateCandidateResult> {
  if (!input.rationale?.trim()) {
    return { success: false, error: "rationale required" };
  }
  if (!validateSource(input.source)) {
    return { success: false, error: `source must be one of: ${IMPROVEMENT_SOURCES.join(", ")}` };
  }
  if (!validateTargetLayer(input.targetLayer)) {
    return { success: false, error: `targetLayer must be one of: ${TARGET_LAYERS.join(", ")}` };
  }

  const candidate = await createImprovementCandidate(supabase, {
    ...input,
    rationale: input.rationale.trim(),
    linkedEvidenceRefs: validateLinkedEvidenceRefs(input.linkedEvidenceRefs),
  });

  if (!candidate) {
    return { success: false, error: "Failed to create candidate" };
  }
  logPhaseDCandidateCreated({
    candidateId: candidate.id,
    source: candidate.source,
    targetLayer: candidate.targetLayer,
    tenantId: candidate.tenantId,
  });
  return { success: true, candidateId: candidate.id };
}

export async function getCandidates(
  supabase: SupabaseClient,
  options: { tenantId?: string | null; reviewStatus?: "pending" | "approved" | "rejected" } = {}
) {
  return listImprovementCandidates(supabase, options);
}

/** Generate a candidate from eval failure. Helper for eval→candidate pipeline. */
export function candidateFromEvalFailure(params: {
  evalRunId: string;
  caseId: string;
  caseTitle: string;
  targetLayer: TargetLayer;
  rationale: string;
  expectedGain?: string;
  risk?: string;
}): Omit<CreateImprovementCandidateInput, "source"> & { source: "eval" } {
  return {
    source: "eval",
    targetLayer: params.targetLayer,
    rationale: params.rationale,
    expectedGain: params.expectedGain ?? null,
    risk: params.risk ?? null,
    linkedEvidenceRefs: [
      { type: "eval", id: params.evalRunId },
      { type: "eval", id: params.caseId },
    ],
  };
}
