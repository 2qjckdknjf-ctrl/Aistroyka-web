import { describe, it, expect } from "vitest";

/**
 * Pure logic: which screen to show for a given orchestration state.
 * Used by PlanFitOnboardingShell; tested here.
 */
function getScreenForOrchestration(
  nextStep: string,
  hasRecommendation: boolean,
  hasSelectedPlan: boolean
): "collect" | "review" | "continue" | "open" | "inconsistent" {
  switch (nextStep) {
    case "collect_plan_fit_input":
      return "collect";
    case "review_recommendation":
    case "select_plan":
      return hasRecommendation ? "review" : "inconsistent";
    case "continue_workspace_setup":
      return hasSelectedPlan ? "continue" : "inconsistent";
    case "open_dashboard":
      return "open";
    case "resolve_inconsistent_state":
      return "inconsistent";
    default:
      return "inconsistent";
  }
}

describe("getScreenForOrchestration", () => {
  it("returns collect for collect_plan_fit_input", () => {
    expect(getScreenForOrchestration("collect_plan_fit_input", false, false)).toBe("collect");
  });

  it("returns review for review_recommendation when has recommendation", () => {
    expect(getScreenForOrchestration("review_recommendation", true, false)).toBe("review");
  });

  it("returns review for select_plan when has recommendation", () => {
    expect(getScreenForOrchestration("select_plan", true, false)).toBe("review");
  });

  it("returns continue for continue_workspace_setup when has selected plan", () => {
    expect(getScreenForOrchestration("continue_workspace_setup", true, true)).toBe("continue");
  });

  it("returns open for open_dashboard", () => {
    expect(getScreenForOrchestration("open_dashboard", true, true)).toBe("open");
  });

  it("returns inconsistent for resolve_inconsistent_state", () => {
    expect(getScreenForOrchestration("resolve_inconsistent_state", false, false)).toBe(
      "inconsistent"
    );
  });

  it("returns inconsistent when review_recommendation but no recommendation", () => {
    expect(getScreenForOrchestration("review_recommendation", false, false)).toBe("inconsistent");
  });
});
