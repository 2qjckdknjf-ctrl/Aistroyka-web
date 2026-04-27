# AI Brain Phase E — Domain Model Spec

## Overview

The Controlled Optimization Layer introduces explicit, typed artifacts for optimization proposals, packages, experiments, comparisons, and decisions. No artifact can change live behavior without explicit approval and activation gating.

## Core Contracts

### AiOptimizationProposal

| Field | Type | Description |
|-------|------|-------------|
| proposalId | string | Primary key |
| sourceCandidateId | string | FK to ai_improvement_candidates(id) |
| tenantId | string \| null | Tenant scope |
| projectId | string \| null | Project scope (optional) |
| targetLayer | TargetLayer | prompt, policy, planner, etc. |
| rationale | string | Required |
| linkedEvidenceRefs | LinkedEvidenceRef[] | From Phase D |
| expectedGain | string \| null | |
| riskLevel | RiskLevel | low, medium, high |
| readiness | string | draft, ready_for_review, etc. |
| reviewStatus | ReviewStatus | pending, approved, rejected |
| createdAt | string | ISO timestamp |

### AiOptimizationPackage

| Field | Type | Description |
|-------|------|-------------|
| packageId | string | Primary key |
| proposalId | string | FK to proposal |
| packageType | string | planner_rule, prompt_adjustment, etc. |
| baselineVersionRefs | AiVersionRef[] | |
| candidateVersionRefs | AiVersionRef[] | |
| changedComponents | string[] | |
| validationRequirements | string[] | |
| approvalRequired | boolean | |
| reviewStatus | ReviewStatus | |

### AiOptimizationExperiment

| Field | Type | Description |
|-------|------|-------------|
| experimentId | string | Primary key |
| packageId | string | FK to package |
| baselineRefs | AiVersionRef[] | |
| candidateRefs | AiVersionRef[] | |
| executionMode | ExecutionMode | sandbox, offline, replay, canary_simulation |
| datasetRef | string \| null | Eval suite or dataset id |
| startedAt | string | |
| endedAt | string \| null | |
| resultSummary | string \| null | |
| status | ExperimentStatus | pending, running, completed, failed |

### AiOptimizationComparison

| Field | Type | Description |
|-------|------|-------------|
| comparisonId | string | Primary key |
| experimentId | string | FK to experiment |
| baselineScoreSummary | Record<string, number> | |
| candidateScoreSummary | Record<string, number> | |
| deltaSummary | Record<string, number> | |
| riskSummary | string \| null | |
| warnings | string[] | |
| regressionFlags | string[] | |

### AiOptimizationDecision

| Field | Type | Description |
|-------|------|-------------|
| decisionId | string | Primary key |
| proposalId | string | |
| packageId | string \| null | |
| experimentId | string \| null | |
| decisionType | DecisionType | approve_for_canary, reject, revise, hold |
| reviewerId | string \| null | |
| reason | string \| null | |
| createdAt | string | |

### AiOptimizationActivationGate

| Field | Type | Description |
|-------|------|-------------|
| gateState | GateState | not_ready, ready_for_review, approved_sandbox, approved_canary_prep, rejected, needs_revision |
| liveActivationPermitted | boolean | Always false in Phase E |

## Separation Rules

1. Proposal ≠ experiment
2. Experiment ≠ decision
3. Decision ≠ activation
4. No "candidate automatically became live"
