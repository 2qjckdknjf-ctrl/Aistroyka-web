/**
 * AI Brain Phase E — Controlled Optimization telemetry.
 * Safe metadata only; no secrets or raw content.
 */

import { logStructured } from "@/lib/observability/logger";

export function logPhaseEProposalCreated(params: {
  proposalId: string;
  sourceCandidateId: string;
  targetLayer: string;
  tenantId: string | null;
}): void {
  logStructured({
    event: "phase_e_proposal_created",
    component: "ai_brain_phase_e",
    proposal_id: params.proposalId,
    source_candidate_id: params.sourceCandidateId,
    target_layer: params.targetLayer,
    tenant_id: params.tenantId,
  });
}

export function logPhaseEPackageCreated(params: {
  packageId: string;
  proposalId: string;
  packageType: string;
}): void {
  logStructured({
    event: "phase_e_package_created",
    component: "ai_brain_phase_e",
    package_id: params.packageId,
    proposal_id: params.proposalId,
    package_type: params.packageType,
  });
}

export function logPhaseEExperimentComplete(params: {
  experimentId: string;
  packageId: string;
  executionMode: string;
  status: string;
  regressionCount: number;
}): void {
  logStructured({
    event: "phase_e_experiment_complete",
    component: "ai_brain_phase_e",
    experiment_id: params.experimentId,
    package_id: params.packageId,
    execution_mode: params.executionMode,
    status: params.status,
    regression_count: params.regressionCount,
  });
}

export function logPhaseEDecisionRecorded(params: {
  decisionId: string;
  proposalId: string;
  decisionType: string;
}): void {
  logStructured({
    event: "phase_e_decision_recorded",
    component: "ai_brain_phase_e",
    decision_id: params.decisionId,
    proposal_id: params.proposalId,
    decision_type: params.decisionType,
  });
}
