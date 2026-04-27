/**
 * AI Brain Phase E — Proposal service.
 * Turns improvement candidates into explicit optimization proposals.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { getImprovementCandidateById } from "../../phase-d/improvement/improvement.repository";
import { logPhaseEProposalCreated } from "../telemetry/phase-e-telemetry";
import { createProposal, listProposals, getProposalById } from "./proposal.repository";
import type { CreateProposalInput } from "./proposal.repository";
import type { OptimizationTargetLayer, RiskLevel } from "../types";
import { OPTIMIZATION_TARGET_LAYERS, RISK_LEVELS } from "../types";
import type { AiImprovementCandidate } from "../../phase-d/improvement/improvement.types";

export type CreateProposalResult =
  | { success: true; proposalId: string }
  | { success: false; error: string };

export function validateTargetLayer(v: unknown): v is OptimizationTargetLayer {
  return typeof v === "string" && OPTIMIZATION_TARGET_LAYERS.includes(v as OptimizationTargetLayer);
}

export function validateRiskLevel(v: unknown): v is RiskLevel {
  return typeof v === "string" && RISK_LEVELS.includes(v as RiskLevel);
}

export async function createProposalFromCandidate(
  supabase: SupabaseClient,
  candidateId: string,
  overrides?: Partial<CreateProposalInput>
): Promise<CreateProposalResult> {
  const candidate = await getImprovementCandidateById(supabase, candidateId);
  if (!candidate) {
    return { success: false, error: "Improvement candidate not found" };
  }

  const targetLayer = mapCandidateTargetToProposalTarget(candidate.targetLayer);
  const proposal = await createProposal(supabase, {
    sourceCandidateId: candidateId,
    tenantId: candidate.tenantId,
    projectId: overrides?.projectId,
    targetLayer: overrides?.targetLayer ?? targetLayer,
    rationale: candidate.rationale,
    linkedEvidenceRefs: candidate.linkedEvidenceRefs,
    expectedGain: candidate.expectedGain ?? overrides?.expectedGain,
    riskLevel: mapRiskToLevel(candidate.risk) ?? overrides?.riskLevel ?? "medium",
    readiness: candidate.readiness ?? overrides?.readiness ?? "draft",
    ...overrides,
  });

  if (!proposal) {
    return { success: false, error: "Failed to create proposal" };
  }
  logPhaseEProposalCreated({
    proposalId: proposal.id,
    sourceCandidateId: candidateId,
    targetLayer: proposal.targetLayer,
    tenantId: proposal.tenantId,
  });
  return { success: true, proposalId: proposal.id };
}

function mapCandidateTargetToProposalTarget(
  t: AiImprovementCandidate["targetLayer"]
): OptimizationTargetLayer {
  if (t === "prompt" || t === "policy" || t === "planner" || t === "tooling" || t === "output" || t === "memory_retrieval") {
    return t;
  }
  return "eval_config";
}

function mapRiskToLevel(risk: string | null): RiskLevel | null {
  if (!risk) return null;
  const l = risk.toLowerCase();
  if (l.includes("low")) return "low";
  if (l.includes("high")) return "high";
  return "medium";
}

export { createProposal, listProposals, getProposalById };
