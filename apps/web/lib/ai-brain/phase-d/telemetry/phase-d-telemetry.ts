/**
 * AI Brain Phase D — Eval & Learning telemetry.
 * Safe metadata only; no secrets or raw content.
 */

import { logStructured } from "@/lib/observability/logger";

export function logPhaseDRunRecorded(params: {
  runId: string;
  tenantId: string;
  route: string;
  mode: string;
  versionRefCount: number;
}): void {
  logStructured({
    event: "phase_d_run_recorded",
    component: "ai_brain_phase_d",
    run_id: params.runId,
    tenant_id: params.tenantId,
    route: params.route,
    mode: params.mode,
    version_ref_count: params.versionRefCount,
  });
}

export function logPhaseDFeedbackRecorded(params: {
  feedbackId: string;
  runId: string;
  tenantId: string;
  sourceKind: string;
  feedbackCategory: string;
}): void {
  logStructured({
    event: "phase_d_feedback_recorded",
    component: "ai_brain_phase_d",
    feedback_id: params.feedbackId,
    run_id: params.runId,
    tenant_id: params.tenantId,
    source_kind: params.sourceKind,
    feedback_category: params.feedbackCategory,
  });
}

export function logPhaseDEvalRunComplete(params: {
  evalRunId: string;
  totalCases: number;
  passed: number;
  failed: number;
  partial: number;
  skipped: number;
  passRate: number;
  durationMs: number;
}): void {
  logStructured({
    event: "phase_d_eval_run_complete",
    component: "ai_brain_phase_d",
    eval_run_id: params.evalRunId,
    total_cases: params.totalCases,
    passed: params.passed,
    failed: params.failed,
    partial: params.partial,
    skipped: params.skipped,
    pass_rate: params.passRate,
    duration_ms: params.durationMs,
  });
}

export function logPhaseDCandidateCreated(params: {
  candidateId: string;
  source: string;
  targetLayer: string;
  tenantId: string | null;
}): void {
  logStructured({
    event: "phase_d_candidate_created",
    component: "ai_brain_phase_d",
    candidate_id: params.candidateId,
    source: params.source,
    target_layer: params.targetLayer,
    tenant_id: params.tenantId,
  });
}

export function logPhaseDEvalCaseSkipped(params: {
  evalRunId: string;
  caseId: string;
  reason: string;
}): void {
  logStructured({
    event: "phase_d_eval_case_skipped",
    component: "ai_brain_phase_d",
    eval_run_id: params.evalRunId,
    case_id: params.caseId,
    reason: params.reason,
  });
}
