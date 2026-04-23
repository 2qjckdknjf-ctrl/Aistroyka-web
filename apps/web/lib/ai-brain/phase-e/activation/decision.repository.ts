/**
 * AI Brain Phase E — Decision repository.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { AiOptimizationDecision, DecisionType } from "../types";

export interface CreateDecisionInput {
  proposalId: string;
  packageId?: string | null;
  experimentId?: string | null;
  decisionType: DecisionType;
  reviewerId?: string | null;
  reason?: string | null;
}

export async function createDecision(
  supabase: SupabaseClient,
  input: CreateDecisionInput
): Promise<AiOptimizationDecision | null> {
  const { data, error } = await supabase
    .from("ai_optimization_decisions")
    .insert({
      proposal_id: input.proposalId,
      package_id: input.packageId ?? null,
      experiment_id: input.experimentId ?? null,
      decision_type: input.decisionType,
      reviewer_id: input.reviewerId ?? null,
      reason: input.reason ?? null,
    })
    .select("id, proposal_id, package_id, experiment_id, decision_type, reviewer_id, reason, created_at")
    .single();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    proposalId: d.proposal_id as string,
    packageId: (d.package_id as string) ?? null,
    experimentId: (d.experiment_id as string) ?? null,
    decisionType: d.decision_type as DecisionType,
    reviewerId: (d.reviewer_id as string) ?? null,
    reason: (d.reason as string) ?? null,
    createdAt: d.created_at as string,
  };
}

export async function getLatestDecisionForProposal(
  supabase: SupabaseClient,
  proposalId: string
): Promise<AiOptimizationDecision | null> {
  const { data, error } = await supabase
    .from("ai_optimization_decisions")
    .select("*")
    .eq("proposal_id", proposalId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    id: d.id as string,
    proposalId: d.proposal_id as string,
    packageId: (d.package_id as string) ?? null,
    experimentId: (d.experiment_id as string) ?? null,
    decisionType: d.decision_type as DecisionType,
    reviewerId: (d.reviewer_id as string) ?? null,
    reason: (d.reason as string) ?? null,
    createdAt: d.created_at as string,
  };
}
