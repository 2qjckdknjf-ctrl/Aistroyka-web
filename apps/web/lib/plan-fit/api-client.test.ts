import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOrchestration, submitRecommendation, selectPlan, fetchLatestRecommendation, fetchCurrentPlan } from "./api-client";

describe("plan-fit api-client", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({}) }))
    );
  });

  it("fetchOrchestration returns data when ok", async () => {
    const mockData = {
      workspaceId: "ws-1",
      hasRecommendation: false,
      latestRecommendation: null,
      hasSelectedPlan: false,
      selectedPlanState: null,
      currentPlanContext: null,
      setupReadiness: { kind: "setup_incomplete" as const, projectCount: 0 },
      orchestrationStatus: "no_recommendation" as const,
      nextStep: "collect_plan_fit_input" as const,
      canProceedToWorkspaceSetup: false,
      canProceedToDashboard: false,
      warnings: [],
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as Response);

    const result = await fetchOrchestration();
    expect(result.orchestrationStatus).toBe("no_recommendation");
    expect(result.nextStep).toBe("collect_plan_fit_input");
    expect(fetch).toHaveBeenCalledWith("/api/v1/plan-fit/orchestration", {
      credentials: "include",
    });
  });

  it("fetchOrchestration throws on error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    } as Response);

    await expect(fetchOrchestration()).rejects.toThrow("Server error");
  });

  it("submitRecommendation posts body and returns data", async () => {
    const input = {
      personaType: "contractor" as const,
      expectedUsersRange: "2_5" as const,
      expectedProjectsRange: "1" as const,
      priorities: ["reports_photo" as const],
      needsMobileWorkforce: true,
      needsFormalProcesses: false,
      startMode: "self_serve" as const,
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          id: "rec-1",
          recommendedPlanCode: "team_contractor",
          alternativePlanCodes: ["client_personal"],
          enterpriseSignal: false,
          reasoningCodes: ["needs_mobile"],
          createdAt: "2025-01-01T00:00:00Z",
        }),
    } as Response);

    const result = await submitRecommendation(input);
    expect(result.recommendedPlanCode).toBe("team_contractor");
    expect(fetch).toHaveBeenCalledWith("/api/v1/plan-fit/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
  });

  it("selectPlan posts body and returns data", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          tenantId: "ws-1",
          canonicalPlanCode: "business_operations",
          sourceKind: "recommendation_selected",
          selectedAt: "2025-01-01T00:00:00Z",
        }),
    } as Response);

    const result = await selectPlan({
      canonicalPlanCode: "business_operations",
      sourceKind: "recommendation_selected",
    });
    expect(result.canonicalPlanCode).toBe("business_operations");
    expect(fetch).toHaveBeenCalledWith("/api/v1/plan-fit/select", expect.any(Object));
  });
});
