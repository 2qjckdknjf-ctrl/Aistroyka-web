/**
 * AI Brain Phase E — Proposal repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { LinkedEvidenceRef } from "../../phase-d/improvement/improvement.types";
import type {
  AiOptimizationProposal,
  OptimizationTargetLayer,
  RiskLevel,
  ProposalReviewStatus,
} from "../types";

export interface CreateProposalInput {
  sourceCandidateId: string;
  tenantId?: string | null;
  projectId?: string | null;
  targetLayer: OptimizationTargetLayer;
  rationale: string;
  linkedEvidenceRefs?: LinkedEvidenceRef[];
  expectedGain?: string | null;
  riskLevel?: RiskLevel;
  readiness?: string;
}

export async function createProposal(
  supabase: SupabaseClient,
  input: CreateProposalInput
): Promise<AiOptimizationProposal | null> {
  const { data, error } = await supabase
    .from("ai_optimization_proposals")
    .insert({
      source_candidate_id: input.sourceCandidateId,
      tenant_id: input.tenantId ?? null,
      project_id: input.projectId ?? null,
      target_layer: input.targetLayer,
      rationale: input.rationale,
      linked_evidence_refs: (input.linkedEvidenceRefs ?? []) as unknown[],
      expected_gain: input.expectedGain ?? null,
      risk_level: input.riskLevel ?? "medium",
      readiness: input.readiness ?? "draft",
      review_status: "pending",
    })
    .select("id, source_candidate_id, tenant_id, project_id, target_layer, rationale, linked_evidence_refs, expected_gain, risk_level, readiness, review_status, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    sourceCandidateId: d.source_candidate_id as string,
    tenantId: (d.tenant_id as string) ?? null,
    projectId: (d.project_id as string) ?? null,
    targetLayer: d.target_layer as OptimizationTargetLayer,
    rationale: d.rationale as string,
    linkedEvidenceRefs: (d.linked_evidence_refs as LinkedEvidenceRef[]) ?? [],
    expectedGain: (d.expected_gain as string) ?? null,
    riskLevel: (d.risk_level as RiskLevel) ?? "medium",
    readiness: (d.readiness as string) ?? "draft",
    reviewStatus: (d.review_status as ProposalReviewStatus) ?? "pending",
    createdAt: d.created_at as string,
  };
}

export async function listProposals(
  supabase: SupabaseClient,
  options: { tenantId?: string | null; reviewStatus?: ProposalReviewStatus } = {}
): Promise<AiOptimizationProposal[]> {
  let q = supabase
    .from("ai_optimization_proposals")
    .select("id, source_candidate_id, tenant_id, project_id, target_layer, rationale, linked_evidence_refs, expected_gain, risk_level, readiness, review_status, created_at")
    .order("created_at", { ascending: false });

  if (options.tenantId !== undefined) {
    q = q.or(`tenant_id.eq.${options.tenantId},tenant_id.is.null`);
  }
  if (options.reviewStatus) {
    q = q.eq("review_status", options.reviewStatus);
  }

  const { data, error } = await q;
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((d) => ({
    id: d.id as string,
    sourceCandidateId: d.source_candidate_id as string,
    tenantId: (d.tenant_id as string) ?? null,
    projectId: (d.project_id as string) ?? null,
    targetLayer: d.target_layer as OptimizationTargetLayer,
    rationale: d.rationale as string,
    linkedEvidenceRefs: (d.linked_evidence_refs as LinkedEvidenceRef[]) ?? [],
    expectedGain: (d.expected_gain as string) ?? null,
    riskLevel: (d.risk_level as RiskLevel) ?? "medium",
    readiness: (d.readiness as string) ?? "draft",
    reviewStatus: (d.review_status as ProposalReviewStatus) ?? "pending",
    createdAt: d.created_at as string,
  }));
}

export async function getProposalById(
  supabase: SupabaseClient,
  proposalId: string
): Promise<AiOptimizationProposal | null> {
  const { data, error } = await supabase
    .from("ai_optimization_proposals")
    .select("*")
    .eq("id", proposalId)
    .maybeSingle();
  if (error || !data) return null;
  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    sourceCandidateId: d.source_candidate_id as string,
    tenantId: (d.tenant_id as string) ?? null,
    projectId: (d.project_id as string) ?? null,
    targetLayer: d.target_layer as OptimizationTargetLayer,
    rationale: d.rationale as string,
    linkedEvidenceRefs: (d.linked_evidence_refs as LinkedEvidenceRef[]) ?? [],
    expectedGain: (d.expected_gain as string) ?? null,
    riskLevel: (d.risk_level as RiskLevel) ?? "medium",
    readiness: (d.readiness as string) ?? "draft",
    reviewStatus: (d.review_status as ProposalReviewStatus) ?? "pending",
    createdAt: d.created_at as string,
  };
}
