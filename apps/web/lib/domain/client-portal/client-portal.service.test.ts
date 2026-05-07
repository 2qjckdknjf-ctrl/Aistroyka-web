import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getClientProjectView, updateClientPortalSettings } from "./client-portal.service";

vi.mock("@/lib/domain/stakeholders/stakeholders.policy", () => ({
  canReadClientPortalView: vi.fn(),
  canRespondToClientRequests: vi.fn(),
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn(),
  updateClientPortalSettings: vi.fn(),
}));
vi.mock("@/lib/domain/projects/project-summary.repository", () => ({
  getProjectSummary: vi.fn(),
}));
vi.mock("@/lib/domain/milestones/milestone.repository", () => ({
  listByProject: vi.fn(),
}));
vi.mock("@/lib/domain/documents/document.repository", () => ({
  listByProject: vi.fn(),
}));
vi.mock("@/lib/domain/client-requests/client-requests.repository", () => ({
  listByProject: vi.fn(),
}));
vi.mock("./client-portal.policy", () => ({
  canManageClientPortalSettings: vi.fn(),
}));
vi.mock("@/lib/domain/customer-estimates/customer-estimates.service", () => ({
  listCustomerEstimates: vi.fn().mockResolvedValue({ data: [], error: "" }),
}));
vi.mock("@/lib/domain/project-handover/project-handover.service", () => ({
  getHandoverPublicSummary: vi.fn().mockResolvedValue({
    data: {
      status: "in_progress",
      handover_notes: null,
      handed_over_at: null,
      completed_at: null,
    },
    error: "",
  }),
}));

const stakeholdersPolicy = await import("@/lib/domain/stakeholders/stakeholders.policy");
const projectRepo = await import("@/lib/domain/projects/project.repository");
const projectSummary = await import("@/lib/domain/projects/project-summary.repository");
const milestoneRepo = await import("@/lib/domain/milestones/milestone.repository");
const docRepo = await import("@/lib/domain/documents/document.repository");
const crRepo = await import("@/lib/domain/client-requests/client-requests.repository");
const policy = await import("./client-portal.policy");

const supabase = {} as SupabaseClient;
const ctx = { tenantId: "t1", userId: "u1", role: "member" as const };

describe("client-portal.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getClientProjectView", () => {
    it("rejects when portal access denied", async () => {
      vi.mocked(stakeholdersPolicy.canReadClientPortalView).mockResolvedValue(false);
      vi.mocked(projectRepo.getById).mockResolvedValue({
        id: "p1",
        name: "X",
        tenant_id: "t1",
        client_portal_enabled: false,
      } as any);
      const { data, error } = await getClientProjectView(supabase, ctx, "p1");
      expect(data).toBeNull();
      expect(error).toBe("Insufficient rights");
    });

    it("returns shaped data without file paths", async () => {
      vi.mocked(stakeholdersPolicy.canReadClientPortalView).mockResolvedValue(true);
      vi.mocked(stakeholdersPolicy.canRespondToClientRequests).mockResolvedValue(true);
      vi.mocked(projectRepo.getById).mockResolvedValue({
        id: "p1",
        name: "Build",
        tenant_id: "t1",
        client_portal_enabled: true,
      } as any);
      vi.mocked(projectSummary.getProjectSummary).mockResolvedValue({
        tasksDone: 2,
        tasksTotal: 5,
      } as any);
      vi.mocked(milestoneRepo.listByProject).mockResolvedValue([
        {
          id: "m1",
          title: "Foundation",
          target_date: "2026-06-01",
          status: "planned",
          client_visible: true,
        },
      ] as any);
      vi.mocked(docRepo.listByProject).mockResolvedValue([
        {
          id: "d1",
          title: "Contract",
          type: "contract",
          status: "under_review",
          updated_at: "2026-01-01",
          client_visible: true,
        },
      ] as any);
      vi.mocked(crRepo.listByProject).mockResolvedValue([]);

      const { data, error } = await getClientProjectView(supabase, ctx, "p1");
      expect(error).toBe("");
      expect(data?.project.name).toBe("Build");
      expect(data?.milestones).toHaveLength(1);
      expect(data?.decisions).toHaveLength(1);
      expect(data?.customer_estimates).toEqual([]);
      expect(data?.client_requests).toEqual([]);
      expect(data?.capabilities.can_respond_to_requests).toBe(true);
      const json = JSON.stringify(data);
      expect(json).not.toContain("object_path");
      expect(json).not.toContain("decision_comment");
      expect(json).not.toContain("planned_total");
      expect(json).not.toContain("actual_total");
      expect(json).not.toContain("over_budget");
    });
  });

  describe("updateClientPortalSettings", () => {
    it("forbidden when policy denies", async () => {
      vi.mocked(policy.canManageClientPortalSettings).mockResolvedValue(false);
      const { data, error } = await updateClientPortalSettings(supabase, ctx, "p1", {
        client_portal_enabled: true,
      });
      expect(data).toBeNull();
      expect(error).toBe("Insufficient rights");
    });

    it("updates when allowed", async () => {
      vi.mocked(policy.canManageClientPortalSettings).mockResolvedValue(true);
      vi.mocked(projectRepo.updateClientPortalSettings).mockResolvedValue({
        id: "p1",
        name: "X",
        tenant_id: "t1",
        client_portal_enabled: true,
      } as any);
      const { data, error } = await updateClientPortalSettings(supabase, ctx, "p1", {
        client_portal_enabled: true,
      });
      expect(error).toBe("");
      expect(data?.client_portal_enabled).toBe(true);
    });
  });
});
