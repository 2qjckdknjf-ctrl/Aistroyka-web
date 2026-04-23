import { describe, expect, it, vi } from "vitest";
import {
  submitPlanFitRecommendation,
  selectWorkspacePlan,
  getWorkspaceSelectedPlan,
  getWorkspaceLatestPlanRecommendation,
} from "./plan-fit-backend.service";
import type { SupabaseClient } from "@supabase/supabase-js";

vi.mock("./persistence/plan-fit-recommendation.repository", () => ({
  createPlanRecommendation: vi.fn(),
  getLatestPlanRecommendationForWorkspace: vi.fn(),
}));

vi.mock("./persistence/workspace-plan-state.repository", () => ({
  getWorkspaceSelectedPlanState: vi.fn(),
  upsertWorkspaceSelectedPlanState: vi.fn(),
}));

const { createPlanRecommendation, getLatestPlanRecommendationForWorkspace } = await import("./persistence/plan-fit-recommendation.repository");
const { getWorkspaceSelectedPlanState, upsertWorkspaceSelectedPlanState } = await import("./persistence/workspace-plan-state.repository");

const noopSupabase = {} as SupabaseClient;

describe("plan-fit backend service", () => {
  describe("submitPlanFitRecommendation", () => {
    it("returns recommendation and id without changing selected plan", async () => {
      vi.mocked(createPlanRecommendation).mockResolvedValue({
        data: {
          id: "rec-1",
          tenantId: "t1",
          userId: "u1",
          inputSnapshot: {},
          recommendedPlanCode: "team_contractor",
          alternativePlanCodes: ["business_operations", "client_personal", "enterprise"],
          enterpriseSignal: false,
          reasoningCodes: ["contractor_mobile_workforce"],
          createdAt: "2026-03-19T12:00:00Z",
        },
        error: null,
      });
      const { data, error } = await submitPlanFitRecommendation(noopSupabase, {
        tenantId: "t1",
        userId: "u1",
        input: {
          personaType: "contractor",
          expectedUsersRange: "6_20",
          expectedProjectsRange: "2_5",
          priorities: ["execution_control", "reports_photo"],
          needsMobileWorkforce: true,
          needsFormalProcesses: false,
          startMode: "self_serve",
        },
      });
      expect(error).toBeNull();
      expect(data?.recommendation.recommendedPlanCode).toBe("team_contractor");
      expect(data?.id).toBe("rec-1");
      expect(data?.createdAt).toBeDefined();
    });
  });

  describe("selectWorkspacePlan", () => {
    it("validates plan code and returns selectedAt", async () => {
      vi.mocked(upsertWorkspaceSelectedPlanState).mockResolvedValue({
        data: {
          tenantId: "t1",
          canonicalPlanCode: "business_operations",
          sourceKind: "recommendation_selected",
          selectedByUserId: "u1",
          selectedAt: "2026-03-19T12:00:00Z",
          addOnCodes: [],
          createdAt: "2026-03-19T12:00:00Z",
          updatedAt: "2026-03-19T12:00:00Z",
        },
        error: null,
      });
      const { data, error } = await selectWorkspacePlan(noopSupabase, {
        tenantId: "t1",
        canonicalPlanCode: "business_operations",
        sourceKind: "recommendation_selected",
        selectedByUserId: "u1",
      });
      expect(error).toBeNull();
      expect(data?.canonicalPlanCode).toBe("business_operations");
      expect(data?.selectedAt).toBeDefined();
    });

    it("rejects invalid plan code", async () => {
      const { data, error } = await selectWorkspacePlan(noopSupabase, {
        tenantId: "t1",
        canonicalPlanCode: "invalid_plan" as "client_personal",
      });
      expect(error).toBe("Invalid canonical plan code");
      expect(data).toBeNull();
    });
  });

  describe("getWorkspaceSelectedPlan", () => {
    it("returns null when no state", async () => {
      vi.mocked(getWorkspaceSelectedPlanState).mockResolvedValue(null);
      const { data } = await getWorkspaceSelectedPlan(noopSupabase, "t1");
      expect(data).toBeNull();
    });
  });

  describe("getWorkspaceLatestPlanRecommendation", () => {
    it("returns null when no recommendation", async () => {
      vi.mocked(getLatestPlanRecommendationForWorkspace).mockResolvedValue(null);
      const { data } = await getWorkspaceLatestPlanRecommendation(noopSupabase, "t1");
      expect(data).toBeNull();
    });
  });
});
