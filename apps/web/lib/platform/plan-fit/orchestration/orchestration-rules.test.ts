import { describe, it, expect } from "vitest";
import { computeOrchestrationRules } from "./orchestration-rules";
import type { SetupReadiness } from "./orchestration.types";

describe("computeOrchestrationRules", () => {
  const setupIncomplete: SetupReadiness = { kind: "setup_incomplete", projectCount: 0 };
  const setupReady: SetupReadiness = { kind: "ready_for_dashboard", projectCount: 1 };

  it("returns inconsistent_state when isInconsistent", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: true,
      hasSelectedPlan: true,
      setupReadiness: setupReady,
      isInconsistent: true,
    });
    expect(r.orchestrationStatus).toBe("inconsistent_state");
    expect(r.nextStep).toBe("resolve_inconsistent_state");
    expect(r.canProceedToWorkspaceSetup).toBe(false);
    expect(r.canProceedToDashboard).toBe(false);
  });

  it("returns dashboard_ready for legacy operational (no rec, no plan, has projects)", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: false,
      hasSelectedPlan: false,
      setupReadiness: setupReady,
      isInconsistent: false,
    });
    expect(r.orchestrationStatus).toBe("dashboard_ready");
    expect(r.nextStep).toBe("open_dashboard");
    expect(r.canProceedToWorkspaceSetup).toBe(true);
    expect(r.canProceedToDashboard).toBe(true);
  });

  it("returns no_recommendation and collect_plan_fit_input when new workspace", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: false,
      hasSelectedPlan: false,
      setupReadiness: setupIncomplete,
      isInconsistent: false,
    });
    expect(r.orchestrationStatus).toBe("no_recommendation");
    expect(r.nextStep).toBe("collect_plan_fit_input");
    expect(r.canProceedToWorkspaceSetup).toBe(false);
    expect(r.canProceedToDashboard).toBe(false);
  });

  it("returns recommendation_ready and review_recommendation when has rec, no plan", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: true,
      hasSelectedPlan: false,
      setupReadiness: setupIncomplete,
      isInconsistent: false,
    });
    expect(r.orchestrationStatus).toBe("recommendation_ready");
    expect(r.nextStep).toBe("review_recommendation");
    expect(r.canProceedToWorkspaceSetup).toBe(false);
    expect(r.canProceedToDashboard).toBe(false);
  });

  it("returns plan_selected and continue_workspace_setup when has plan, setup incomplete", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: false,
      hasSelectedPlan: true,
      setupReadiness: setupIncomplete,
      isInconsistent: false,
    });
    expect(r.orchestrationStatus).toBe("plan_selected");
    expect(r.nextStep).toBe("continue_workspace_setup");
    expect(r.canProceedToWorkspaceSetup).toBe(true);
    expect(r.canProceedToDashboard).toBe(false);
  });

  it("returns setup_ready and open_dashboard when has plan and setup ready", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: true,
      hasSelectedPlan: true,
      setupReadiness: setupReady,
      isInconsistent: false,
    });
    expect(r.orchestrationStatus).toBe("setup_ready");
    expect(r.nextStep).toBe("open_dashboard");
    expect(r.canProceedToWorkspaceSetup).toBe(true);
    expect(r.canProceedToDashboard).toBe(true);
  });

  it("returns setup_ready when has plan only (no rec) and setup ready", () => {
    const r = computeOrchestrationRules({
      hasRecommendation: false,
      hasSelectedPlan: true,
      setupReadiness: setupReady,
      isInconsistent: false,
    });
    expect(r.orchestrationStatus).toBe("setup_ready");
    expect(r.nextStep).toBe("open_dashboard");
  });
});
