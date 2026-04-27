/**
 * Plan-fit orchestration state model (Step 5).
 * Post-registration / first-entry: status, next step, setup readiness.
 * Orchestration ≠ onboarding UI; this is server-side state for routing and future UI.
 */

import type { PlanCode } from "@aistroyka/contracts";
import type { WorkspacePlanStateDTO } from "../persistence/plan-fit.types";
import type { PlanFitRecommendationDTO } from "../persistence/plan-fit.types";
import type { WorkspacePlanContext } from "../workspace-plan-context.types";
import type { SetupReadinessV2 } from "./setup-readiness.types";

/** Minimal recommendation payload for orchestration response (no full input snapshot). */
export interface OrchestrationRecommendationSummary {
  id: string;
  recommendedPlanCode: PlanCode;
  alternativePlanCodes: PlanCode[];
  enterpriseSignal: boolean;
  reasoningCodes: string[];
  createdAt: string;
}

export type OrchestrationStatus =
  | "no_recommendation"
  | "recommendation_ready"
  | "plan_selected"
  | "setup_ready"
  | "dashboard_ready"
  | "inconsistent_state";

export type OrchestrationNextStep =
  | "collect_plan_fit_input"
  | "review_recommendation"
  | "select_plan"
  | "continue_workspace_setup"
  | "open_dashboard"
  | "resolve_inconsistent_state";

/**
 * Setup readiness: based on existing project count (same signal as activation/status showOnboarding).
 * setup_incomplete = no projects; ready_for_dashboard = at least one project.
 * Step 7: also treat minimally_ready as "ready" for orchestration.
 */
export type SetupReadinessKind = "setup_incomplete" | "ready_for_dashboard";

export interface SetupReadiness {
  kind: SetupReadinessKind;
  projectCount: number;
}

export interface WorkspacePlanFitOrchestrationState {
  workspaceId: string;
  hasRecommendation: boolean;
  latestRecommendation: OrchestrationRecommendationSummary | null;
  hasSelectedPlan: boolean;
  selectedPlanState: WorkspacePlanStateDTO | null;
  currentPlanContext: WorkspacePlanContext | null;
  setupReadiness: SetupReadiness;
  /** Step 7: richer setup detail for UI */
  setup?: SetupReadinessV2;
  orchestrationStatus: OrchestrationStatus;
  nextStep: OrchestrationNextStep;
  canProceedToWorkspaceSetup: boolean;
  canProceedToDashboard: boolean;
  warnings: string[];
  notes?: string[];
}
