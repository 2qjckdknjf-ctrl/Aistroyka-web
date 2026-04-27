/**
 * Plan-fit orchestration service (Step 5).
 * getWorkspacePlanFitOrchestrationState: aggregates recommendation, selected plan, runtime context, setup readiness;
 * computes status and nextStep. Server-safe, tenant-scoped.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanCode } from "@aistroyka/contracts";
import { getWorkspaceSelectedPlanState } from "../persistence/workspace-plan-state.repository";
import { getLatestPlanRecommendationForWorkspace } from "../persistence/plan-fit-recommendation.repository";
import { getWorkspacePlanContextFromRuntime } from "../runtime-plan-context.service";
import type { WorkspacePlanFitOrchestrationState, OrchestrationRecommendationSummary } from "./orchestration.types";
import { evaluateSetupReadinessV2 } from "./setup-readiness.evaluator";
import { computeOrchestrationRules } from "./orchestration-rules";

const VALID_PLAN_CODES: PlanCode[] = [
  "client_personal",
  "team_contractor",
  "business_operations",
  "enterprise",
];

function isValidPlanCode(code: string): code is PlanCode {
  return VALID_PLAN_CODES.includes(code as PlanCode);
}

function toRecommendationSummary(rec: {
  id: string;
  recommendedPlanCode: string;
  alternativePlanCodes: string[];
  enterpriseSignal: boolean;
  reasoningCodes: string[];
  createdAt: string;
}): OrchestrationRecommendationSummary | null {
  if (!isValidPlanCode(rec.recommendedPlanCode)) return null;
  const alternativePlanCodes = rec.alternativePlanCodes.filter((c): c is PlanCode => isValidPlanCode(c));
  return {
    id: rec.id,
    recommendedPlanCode: rec.recommendedPlanCode as PlanCode,
    alternativePlanCodes,
    enterpriseSignal: rec.enterpriseSignal,
    reasoningCodes: rec.reasoningCodes,
    createdAt: rec.createdAt,
  };
}

/**
 * Get full orchestration state for a workspace.
 * Fetches: latest recommendation, selected plan state, runtime plan context, setup readiness.
 * Applies legacy/transitional policy: workspace with projects but no plan-fit data → dashboard_ready.
 */
export async function getWorkspacePlanFitOrchestrationState(
  supabase: SupabaseClient,
  workspaceId: string
): Promise<WorkspacePlanFitOrchestrationState> {
  const warnings: string[] = [];

  const [recommendationRow, selectedState, planContext, setupV2] = await Promise.all([
    getLatestPlanRecommendationForWorkspace(supabase, workspaceId),
    getWorkspaceSelectedPlanState(supabase, workspaceId),
    getWorkspacePlanContextFromRuntime(supabase, workspaceId).catch((err) => {
      warnings.push(`Runtime plan context failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }),
    evaluateSetupReadinessV2(supabase, workspaceId),
  ]);

  const setupReadiness = {
    kind:
      setupV2.kind === "minimally_ready" || setupV2.kind === "ready_for_dashboard"
        ? "ready_for_dashboard" as const
        : "setup_incomplete" as const,
    projectCount: setupV2.projectCount,
  };

  const hasRecommendation = recommendationRow != null;
  const recSummary: OrchestrationRecommendationSummary | null = recommendationRow
    ? toRecommendationSummary({
        id: recommendationRow.id,
        recommendedPlanCode: recommendationRow.recommendedPlanCode,
        alternativePlanCodes: recommendationRow.alternativePlanCodes,
        enterpriseSignal: recommendationRow.enterpriseSignal,
        reasoningCodes: recommendationRow.reasoningCodes,
        createdAt: recommendationRow.createdAt,
      })
    : null;

  // If we have a row but summary is null, recommendation payload was invalid
  const recommendationInvalid = hasRecommendation && recSummary === null;
  const selectedPlanInvalid =
    selectedState != null && !isValidPlanCode(selectedState.canonicalPlanCode);
  const isInconsistent = recommendationInvalid || selectedPlanInvalid;

  if (recommendationInvalid) warnings.push("Latest recommendation has invalid plan code; treat as inconsistent.");
  if (selectedPlanInvalid) warnings.push("Selected plan state has invalid plan code; treat as inconsistent.");

  const hasValidRecommendation = recSummary != null;
  const hasSelectedPlan = selectedState != null && !selectedPlanInvalid;

  const rules = computeOrchestrationRules({
    hasRecommendation: hasValidRecommendation,
    hasSelectedPlan,
    setupReadiness,
    isInconsistent,
  });

  return {
    workspaceId,
    hasRecommendation: hasValidRecommendation,
    latestRecommendation: recSummary,
    hasSelectedPlan,
    selectedPlanState: hasSelectedPlan ? selectedState : null,
    currentPlanContext: planContext ?? null,
    setupReadiness,
    setup: setupV2,
    orchestrationStatus: rules.orchestrationStatus,
    nextStep: rules.nextStep,
    canProceedToWorkspaceSetup: rules.canProceedToWorkspaceSetup,
    canProceedToDashboard: rules.canProceedToDashboard,
    warnings,
  };
}
