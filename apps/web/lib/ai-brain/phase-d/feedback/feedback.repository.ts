/**
 * AI Brain Phase D — Feedback repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiFeedbackRecord, CreateFeedbackInput, LinkedRef } from "./feedback.types";

function scoreInRange(v: number | null | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (Number.isNaN(n) || n < 0 || n > 5) return null;
  return Math.round(n) as 0 | 1 | 2 | 3 | 4 | 5;
}

export async function createFeedbackRecord(
  supabase: SupabaseClient,
  runRecordId: string,
  input: CreateFeedbackInput
): Promise<AiFeedbackRecord | null> {
  const { data, error } = await supabase
    .from("ai_feedback_records")
    .insert({
      run_id: runRecordId,
      tenant_id: input.tenantId,
      source_kind: input.sourceKind,
      reviewer_role: input.reviewerRole ?? null,
      feedback_category: input.feedbackCategory,
      factuality_score: scoreInRange(input.factualityScore),
      usefulness_score: scoreInRange(input.usefulnessScore),
      safety_score: scoreInRange(input.safetyScore),
      role_fit_score: scoreInRange(input.roleFitScore),
      completeness_score: scoreInRange(input.completenessScore),
      comments: input.comments?.trim() || null,
      linked_refs: (input.linkedRefs ?? []) as unknown[],
    })
    .select("id, run_id, tenant_id, source_kind, reviewer_role, feedback_category, factuality_score, usefulness_score, safety_score, role_fit_score, completeness_score, comments, linked_refs, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    runRecordId: d.run_id as string,
    tenantId: d.tenant_id as string,
    sourceKind: d.source_kind as AiFeedbackRecord["sourceKind"],
    reviewerRole: (d.reviewer_role as string) ?? null,
    feedbackCategory: d.feedback_category as AiFeedbackRecord["feedbackCategory"],
    factualityScore: scoreInRange(d.factuality_score as number | null) as AiFeedbackRecord["factualityScore"],
    usefulnessScore: scoreInRange(d.usefulness_score as number | null) as AiFeedbackRecord["usefulnessScore"],
    safetyScore: scoreInRange(d.safety_score as number | null) as AiFeedbackRecord["safetyScore"],
    roleFitScore: scoreInRange(d.role_fit_score as number | null) as AiFeedbackRecord["roleFitScore"],
    completenessScore: scoreInRange(d.completeness_score as number | null) as AiFeedbackRecord["completenessScore"],
    comments: (d.comments as string) ?? null,
    linkedRefs: (d.linked_refs as LinkedRef[]) ?? [],
    createdAt: d.created_at as string,
  };
}
