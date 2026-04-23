/**
 * AI Brain Phase E — Controlled Optimization types.
 */

import type { AiVersionRef } from "../phase-d/run/run.types";
import type { LinkedEvidenceRef } from "../phase-d/improvement/improvement.types";

export const OPTIMIZATION_TARGET_LAYERS = [
  "prompt",
  "policy",
  "planner",
  "tooling",
  "output",
  "memory_retrieval",
  "eval_config",
] as const;
export type OptimizationTargetLayer = (typeof OPTIMIZATION_TARGET_LAYERS)[number];

export const RISK_LEVELS = ["low", "medium", "high"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const PROPOSAL_REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ProposalReviewStatus = (typeof PROPOSAL_REVIEW_STATUSES)[number];

export const PACKAGE_TYPES = [
  "planner_rule",
  "prompt_adjustment",
  "policy_tweak",
  "memory_threshold",
  "output_contract",
  "grader_config",
  "eval_config",
] as const;
export type PackageType = (typeof PACKAGE_TYPES)[number];

export const EXECUTION_MODES = ["sandbox", "offline", "replay", "canary_simulation"] as const;
export type ExecutionMode = (typeof EXECUTION_MODES)[number];

export const EXPERIMENT_STATUSES = ["pending", "running", "completed", "failed"] as const;
export type ExperimentStatus = (typeof EXPERIMENT_STATUSES)[number];

export const DECISION_TYPES = ["approve_for_canary", "reject", "revise", "hold"] as const;
export type DecisionType = (typeof DECISION_TYPES)[number];

export const GATE_STATES = [
  "not_ready",
  "ready_for_review",
  "approved_sandbox",
  "approved_canary_prep",
  "rejected",
  "needs_revision",
] as const;
export type GateState = (typeof GATE_STATES)[number];

export interface AiOptimizationProposal {
  id: string;
  sourceCandidateId: string;
  tenantId: string | null;
  projectId: string | null;
  targetLayer: OptimizationTargetLayer;
  rationale: string;
  linkedEvidenceRefs: LinkedEvidenceRef[];
  expectedGain: string | null;
  riskLevel: RiskLevel;
  readiness: string;
  reviewStatus: ProposalReviewStatus;
  createdAt: string;
}

export interface AiOptimizationPackage {
  id: string;
  proposalId: string;
  packageType: PackageType;
  baselineVersionRefs: AiVersionRef[];
  candidateVersionRefs: AiVersionRef[];
  changedComponents: string[];
  validationRequirements: string[];
  approvalRequired: boolean;
  reviewStatus: ProposalReviewStatus;
  createdAt: string;
}

export interface AiOptimizationExperiment {
  id: string;
  packageId: string;
  baselineRefs: AiVersionRef[];
  candidateRefs: AiVersionRef[];
  executionMode: ExecutionMode;
  datasetRef: string | null;
  startedAt: string;
  endedAt: string | null;
  resultSummary: string | null;
  status: ExperimentStatus;
}

export interface AiOptimizationComparison {
  id: string;
  experimentId: string;
  baselineScoreSummary: Record<string, number>;
  candidateScoreSummary: Record<string, number>;
  deltaSummary: Record<string, number>;
  riskSummary: string | null;
  warnings: string[];
  regressionFlags: string[];
  createdAt: string;
}

export interface AiOptimizationDecision {
  id: string;
  proposalId: string;
  packageId: string | null;
  experimentId: string | null;
  decisionType: DecisionType;
  reviewerId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface AiOptimizationActivationGate {
  gateState: GateState;
  liveActivationPermitted: boolean;
}
