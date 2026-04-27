import { describe, it, expect, vi, beforeEach } from "vitest";
import { getWorkspacePlanFitOrchestrationState } from "./orchestration.service";
import * as recRepo from "../persistence/plan-fit-recommendation.repository";
import * as stateRepo from "../persistence/workspace-plan-state.repository";
import * as runtimeCtx from "../runtime-plan-context.service";
import * as setupReadiness from "./setup-readiness.evaluator";

vi.mock("../persistence/plan-fit-recommendation.repository");
vi.mock("../persistence/workspace-plan-state.repository");
vi.mock("../runtime-plan-context.service");
vi.mock("./setup-readiness.evaluator");

const supabase = {} as import("@supabase/supabase-js").SupabaseClient;

const defaultSetupV2 = {
  kind: "setup_incomplete" as const,
  projectCount: 0,
  completedSteps: [] as string[],
  missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
  nextActionKey: "create_first_project" as const,
  targetRoute: "/projects/new",
};

describe("getWorkspacePlanFitOrchestrationState", () => {
  beforeEach(() => {
    vi.mocked(setupReadiness.evaluateSetupReadinessV2).mockResolvedValue(defaultSetupV2);
    vi.mocked(runtimeCtx.getWorkspacePlanContextFromRuntime).mockResolvedValue({
      workspaceId: "ws-1",
      canonicalPlanCode: "client_personal",
      sourceKind: "canonical_plan",
      addOnCodes: [],
      effectiveEntitlements: {} as never,
      effectiveCapabilities: {} as never,
    });
  });

  it("returns no_recommendation and collect_plan_fit_input for new workspace", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue(null);

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("no_recommendation");
    expect(state.nextStep).toBe("collect_plan_fit_input");
    expect(state.hasRecommendation).toBe(false);
    expect(state.hasSelectedPlan).toBe(false);
    expect(state.canProceedToDashboard).toBe(false);
  });

  it("returns recommendation_ready when has recommendation, no selected plan", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue({
      id: "rec-1",
      tenantId: "ws-1",
      userId: null,
      inputSnapshot: {},
      recommendedPlanCode: "team_contractor",
      alternativePlanCodes: ["client_personal"],
      enterpriseSignal: false,
      reasoningCodes: ["needs_mobile"],
      createdAt: "2025-01-01T00:00:00Z",
    });
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue(null);

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("recommendation_ready");
    expect(state.nextStep).toBe("review_recommendation");
    expect(state.hasRecommendation).toBe(true);
    expect(state.latestRecommendation?.recommendedPlanCode).toBe("team_contractor");
    expect(state.hasSelectedPlan).toBe(false);
  });

  it("returns plan_selected and continue_workspace_setup when has selected plan, no projects", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue({
      tenantId: "ws-1",
      canonicalPlanCode: "business_operations",
      sourceKind: "recommendation_selected",
      selectedByUserId: null,
      selectedAt: "2025-01-01T00:00:00Z",
      addOnCodes: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("plan_selected");
    expect(state.nextStep).toBe("continue_workspace_setup");
    expect(state.hasSelectedPlan).toBe(true);
    expect(state.canProceedToWorkspaceSetup).toBe(true);
    expect(state.canProceedToDashboard).toBe(false);
  });

  it("returns setup_ready and open_dashboard when has selected plan and projects", async () => {
    vi.mocked(setupReadiness.evaluateSetupReadinessV2).mockResolvedValue({
      ...defaultSetupV2,
      kind: "ready_for_dashboard",
      projectCount: 1,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard",
      targetRoute: "/dashboard",
    });
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue({
      tenantId: "ws-1",
      canonicalPlanCode: "business_operations",
      sourceKind: "manual_backend_set",
      selectedByUserId: null,
      selectedAt: "2025-01-01T00:00:00Z",
      addOnCodes: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("setup_ready");
    expect(state.nextStep).toBe("open_dashboard");
    expect(state.canProceedToDashboard).toBe(true);
  });

  it("returns dashboard_ready for legacy operational workspace (no rec, no plan, has projects)", async () => {
    vi.mocked(setupReadiness.evaluateSetupReadinessV2).mockResolvedValue({
      ...defaultSetupV2,
      kind: "ready_for_dashboard",
      projectCount: 3,
      completedSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      missingSteps: [],
      nextActionKey: "open_dashboard",
      targetRoute: "/dashboard",
    });
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue(null);

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("dashboard_ready");
    expect(state.nextStep).toBe("open_dashboard");
    expect(state.canProceedToDashboard).toBe(true);
  });

  it("returns inconsistent_state when selected plan has invalid plan code", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue({
      tenantId: "ws-1",
      canonicalPlanCode: "invalid_plan" as "client_personal",
      sourceKind: "manual_backend_set",
      selectedByUserId: null,
      selectedAt: "2025-01-01T00:00:00Z",
      addOnCodes: [],
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-01T00:00:00Z",
    });

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("inconsistent_state");
    expect(state.nextStep).toBe("resolve_inconsistent_state");
    expect(state.hasSelectedPlan).toBe(false);
    expect(state.selectedPlanState).toBe(null);
    expect(state.warnings.some((w) => w.includes("invalid"))).toBe(true);
  });

  it("returns inconsistent_state when recommendation has invalid plan code", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue({
      id: "rec-1",
      tenantId: "ws-1",
      userId: null,
      inputSnapshot: {},
      recommendedPlanCode: "bad_code" as "client_personal",
      alternativePlanCodes: [],
      enterpriseSignal: false,
      reasoningCodes: [],
      createdAt: "2025-01-01T00:00:00Z",
    });
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue(null);

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.orchestrationStatus).toBe("inconsistent_state");
    expect(state.nextStep).toBe("resolve_inconsistent_state");
    expect(state.hasRecommendation).toBe(false);
    expect(state.latestRecommendation).toBe(null);
  });

  it("includes setup detail in response", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue(null);
    vi.mocked(setupReadiness.evaluateSetupReadinessV2).mockResolvedValue({
      ...defaultSetupV2,
      kind: "setup_missing",
      missingSteps: ["first_project_created", "workspace_name_set", "has_invited_or_collaborator"],
      nextActionKey: "create_first_project",
      targetRoute: "/projects/new",
    });

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.setup).toBeDefined();
    expect(state.setup?.kind).toBe("setup_missing");
    expect(state.setup?.completedSteps).toEqual([]);
    expect(state.setup?.missingSteps).toContain("first_project_created");
    expect(state.setup?.nextActionKey).toBe("create_first_project");
    expect(state.setup?.targetRoute).toBe("/projects/new");
  });

  it("includes currentPlanContext from runtime", async () => {
    vi.mocked(recRepo.getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
    vi.mocked(stateRepo.getWorkspaceSelectedPlanState).mockResolvedValue(null);
    vi.mocked(runtimeCtx.getWorkspacePlanContextFromRuntime).mockResolvedValue({
      workspaceId: "ws-1",
      canonicalPlanCode: "enterprise",
      sourceKind: "legacy_tier_bridge",
      addOnCodes: [],
      effectiveEntitlements: {} as never,
      effectiveCapabilities: {} as never,
    });

    const state = await getWorkspacePlanFitOrchestrationState(supabase, "ws-1");

    expect(state.currentPlanContext?.canonicalPlanCode).toBe("enterprise");
    expect(state.currentPlanContext?.sourceKind).toBe("legacy_tier_bridge");
  });
});
