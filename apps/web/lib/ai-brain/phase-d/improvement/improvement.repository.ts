/**
 * AI Brain Phase D — Improvement candidate repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AiImprovementCandidate,
  LinkedEvidenceRef,
  ReviewStatus,
} from "./improvement.types";
import type { CreateImprovementCandidateInput } from "./improvement.types";

export async function createImprovementCandidate(
  supabase: SupabaseClient,
  input: CreateImprovementCandidateInput
): Promise<AiImprovementCandidate | null> {
  const { data, error } = await supabase
    .from("ai_improvement_candidates")
    .insert({
      tenant_id: input.tenantId ?? null,
      source: input.source,
      target_layer: input.targetLayer,
      rationale: input.rationale,
      expected_gain: input.expectedGain ?? null,
      risk: input.risk ?? null,
      readiness: input.readiness ?? "draft",
      review_status: "pending",
      linked_evidence_refs: (input.linkedEvidenceRefs ?? []) as unknown[],
    })
    .select("id, tenant_id, source, target_layer, rationale, expected_gain, risk, readiness, review_status, linked_evidence_refs, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    tenantId: (d.tenant_id as string) ?? null,
    source: d.source as AiImprovementCandidate["source"],
    targetLayer: d.target_layer as AiImprovementCandidate["targetLayer"],
    rationale: d.rationale as string,
    expectedGain: (d.expected_gain as string) ?? null,
    risk: (d.risk as string) ?? null,
    readiness: (d.readiness as string) ?? "draft",
    reviewStatus: (d.review_status as ReviewStatus) ?? "pending",
    linkedEvidenceRefs: (d.linked_evidence_refs as LinkedEvidenceRef[]) ?? [],
    createdAt: d.created_at as string,
  };
}

export async function listImprovementCandidates(
  supabase: SupabaseClient,
  options: { tenantId?: string | null; reviewStatus?: ReviewStatus } = {}
): Promise<AiImprovementCandidate[]> {
  let q = supabase
    .from("ai_improvement_candidates")
    .select("id, tenant_id, source, target_layer, rationale, expected_gain, risk, readiness, review_status, linked_evidence_refs, created_at")
    .order("created_at", { ascending: false });

  if (options.tenantId !== undefined) {
    q = q.or(`tenant_id.eq.${options.tenantId},tenant_id.is.null`);
  }
  if (options.reviewStatus) {
    q = q.eq("review_status", options.reviewStatus);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map(mapRowToCandidate);
}

function mapRowToCandidate(d: Record<string, unknown>): AiImprovementCandidate {
  return {
    id: d.id as string,
    tenantId: (d.tenant_id as string) ?? null,
    source: d.source as AiImprovementCandidate["source"],
    targetLayer: d.target_layer as AiImprovementCandidate["targetLayer"],
    rationale: d.rationale as string,
    expectedGain: (d.expected_gain as string) ?? null,
    risk: (d.risk as string) ?? null,
    readiness: (d.readiness as string) ?? "draft",
    reviewStatus: (d.review_status as ReviewStatus) ?? "pending",
    linkedEvidenceRefs: (d.linked_evidence_refs as LinkedEvidenceRef[]) ?? [],
    createdAt: d.created_at as string,
  };
}

export async function getImprovementCandidateById(
  supabase: SupabaseClient,
  candidateId: string
): Promise<AiImprovementCandidate | null> {
  const { data, error } = await supabase
    .from("ai_improvement_candidates")
    .select("id, tenant_id, source, target_layer, rationale, expected_gain, risk, readiness, review_status, linked_evidence_refs, created_at")
    .eq("id", candidateId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRowToCandidate(data as Record<string, unknown>);
}
