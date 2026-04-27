/**
 * Plan-fit orchestration rules (Step 5).
 * Computes orchestrationStatus and nextStep from recommendation, selected plan, setup readiness.
 *
 * Legacy/transitional policy: Workspace with projects but no plan-fit data (no recommendation,
 * no selected plan) is treated as already operational → dashboard_ready, open_dashboard.
 * This avoids blocking existing users who have not gone through the new plan-fit flow.
 *
 * Inconsistent state: When persistence has invalid data (e.g. invalid plan code), rules
 * return inconsistent_state and nextStep resolve_inconsistent_state; canProceedTo* are false.
 */

import type {
  OrchestrationStatus,
  OrchestrationNextStep,
  SetupReadiness,
} from "./orchestration.types";

export interface OrchestrationRulesInput {
  hasRecommendation: boolean;
  hasSelectedPlan: boolean;
  setupReadiness: SetupReadiness;
  /** True when persistence/runtime data is invalid or conflicting. */
  isInconsistent: boolean;
}

export interface OrchestrationRulesResult {
  orchestrationStatus: OrchestrationStatus;
  nextStep: OrchestrationNextStep;
  canProceedToWorkspaceSetup: boolean;
  canProceedToDashboard: boolean;
}

/**
 * Compute orchestration state from inputs.
 * Rules:
 * 1. Inconsistent data → inconsistent_state, resolve_inconsistent_state.
 * 2. Has recommendation + has selected plan + setup ready → dashboard_ready, open_dashboard.
 * 3. Has recommendation + has selected plan + setup not ready → plan_selected, continue_workspace_setup.
 * 4. Has recommendation, no selected plan → recommendation_ready, review_recommendation.
 * 5. No recommendation, no selected plan, has projects (legacy operational) → dashboard_ready, open_dashboard.
 * 6. No recommendation, no selected plan, no projects → no_recommendation, collect_plan_fit_input.
 * 7. Has selected plan, no recommendation, setup ready → setup_ready, open_dashboard.
 * 8. Has selected plan, no recommendation, setup not ready → plan_selected, continue_workspace_setup.
 */
export function computeOrchestrationRules(
  input: OrchestrationRulesInput
): OrchestrationRulesResult {
  const { hasRecommendation, hasSelectedPlan, setupReadiness, isInconsistent } = input;
  const setupReady = setupReadiness.kind === "ready_for_dashboard";

  if (isInconsistent) {
    return {
      orchestrationStatus: "inconsistent_state",
      nextStep: "resolve_inconsistent_state",
      canProceedToWorkspaceSetup: false,
      canProceedToDashboard: false,
    };
  }

  // Legacy/transitional: no plan-fit data but workspace has projects → already operational
  if (!hasRecommendation && !hasSelectedPlan && setupReady) {
    return {
      orchestrationStatus: "dashboard_ready",
      nextStep: "open_dashboard",
      canProceedToWorkspaceSetup: true,
      canProceedToDashboard: true,
    };
  }

  if (!hasRecommendation && !hasSelectedPlan) {
    return {
      orchestrationStatus: "no_recommendation",
      nextStep: "collect_plan_fit_input",
      canProceedToWorkspaceSetup: false,
      canProceedToDashboard: false,
    };
  }

  if (hasRecommendation && !hasSelectedPlan) {
    return {
      orchestrationStatus: "recommendation_ready",
      nextStep: "review_recommendation",
      canProceedToWorkspaceSetup: false,
      canProceedToDashboard: false,
    };
  }

  // hasSelectedPlan from here
  if (setupReady) {
    return {
      orchestrationStatus: "setup_ready",
      nextStep: "open_dashboard",
      canProceedToWorkspaceSetup: true,
      canProceedToDashboard: true,
    };
  }

  return {
    orchestrationStatus: "plan_selected",
    nextStep: "continue_workspace_setup",
    canProceedToWorkspaceSetup: true,
    canProceedToDashboard: false,
  };
}
