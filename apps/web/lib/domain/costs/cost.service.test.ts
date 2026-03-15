import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listCostItems,
  getBudgetSummary,
  getCostItemById,
  createCostItem,
  updateCostItem,
} from "./cost.service";

vi.mock("@/lib/tenant/tenant.policy", () => ({
  canReadProjects: vi.fn().mockReturnValue(true),
  canManageProjects: vi.fn().mockReturnValue(true),
}));
vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: vi.fn().mockResolvedValue({ id: "proj-1", tenant_id: "tenant-1" }),
}));
vi.mock("./cost.repository", () => ({
  listByProject: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  getBudgetSummary: vi.fn(),
}));

const costRepo = await import("./cost.repository");
const projectRepo = await import("@/lib/domain/projects/project.repository");
const tenantPolicy = await import("@/lib/tenant/tenant.policy");

const ctx = { tenantId: "tenant-1", userId: "user-1", role: "manager" as const };
const supabase = {} as SupabaseClient;

describe("cost.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tenantPolicy.canReadProjects).mockReturnValue(true);
    vi.mocked(tenantPolicy.canManageProjects).mockReturnValue(true);
    vi.mocked(projectRepo.getById).mockResolvedValue({ id: "proj-1", tenant_id: "tenant-1" } as any);
  });

  describe("listCostItems", () => {
    it("returns cost items when project exists", async () => {
      const items = [
        {
          id: "cost-1",
          tenant_id: "tenant-1",
          project_id: "proj-1",
          category: "materials",
          title: "Cement",
          planned_amount: 1000,
          actual_amount: 500,
          currency: "RUB",
          status: "incurred" as const,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      ];
      vi.mocked(costRepo.listByProject).mockResolvedValue(items as any);
      const { data, error } = await listCostItems(supabase, ctx, "proj-1");
      expect(error).toBe("");
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe("Cement");
    });

    it("returns error when project not found", async () => {
      vi.mocked(projectRepo.getById).mockResolvedValue(null);
      const { data, error } = await listCostItems(supabase, ctx, "proj-unknown");
      expect(error).toBe("Project not found");
      expect(data).toEqual([]);
    });

    it("returns error when insufficient rights", async () => {
      vi.mocked(tenantPolicy.canReadProjects).mockReturnValue(false);
      const { data, error } = await listCostItems(supabase, ctx, "proj-1");
      expect(error).toBe("Insufficient rights");
      expect(data).toEqual([]);
    });
  });

  describe("getBudgetSummary", () => {
    it("returns budget summary when project exists", async () => {
      const summary = {
        project_id: "proj-1",
        tenant_id: "tenant-1",
        planned_total: 10000,
        actual_total: 8500,
        currency: "RUB",
        over_budget: false,
        item_count: 5,
      };
      vi.mocked(costRepo.getBudgetSummary).mockResolvedValue(summary);
      const { data, error } = await getBudgetSummary(supabase, ctx, "proj-1");
      expect(error).toBe("");
      expect(data?.planned_total).toBe(10000);
      expect(data?.over_budget).toBe(false);
    });
  });

  describe("createCostItem", () => {
    it("creates cost item with valid input", async () => {
      const created = {
        id: "cost-new",
        tenant_id: "tenant-1",
        project_id: "proj-1",
        category: "labor",
        title: "Installation",
        planned_amount: 5000,
        actual_amount: 0,
        currency: "RUB",
        status: "planned" as const,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      };
      vi.mocked(costRepo.create).mockResolvedValue(created as any);
      const { data, error } = await createCostItem(supabase, ctx, {
        project_id: "proj-1",
        category: "labor",
        title: "Installation",
        planned_amount: 5000,
      });
      expect(error).toBe("");
      expect(data?.title).toBe("Installation");
    });

    it("returns error when title empty", async () => {
      const { data, error } = await createCostItem(supabase, ctx, {
        project_id: "proj-1",
        category: "labor",
        title: "   ",
        planned_amount: 5000,
      });
      expect(error).toBe("title required");
      expect(data).toBeNull();
    });

    it("returns error when planned_amount invalid", async () => {
      const { data, error } = await createCostItem(supabase, ctx, {
        project_id: "proj-1",
        category: "labor",
        title: "Work",
        planned_amount: -100,
      });
      expect(error).toBe("planned_amount must be >= 0");
      expect(data).toBeNull();
    });
  });

  describe("updateCostItem", () => {
    it("updates cost item with valid input", async () => {
      const existing = {
        id: "cost-1",
        project_id: "proj-1",
        tenant_id: "tenant-1",
        title: "Cement",
        planned_amount: 1000,
        actual_amount: 500,
        status: "incurred" as const,
      };
      const updated = { ...existing, actual_amount: 1100 };
      vi.mocked(costRepo.getById).mockResolvedValue(existing as any);
      vi.mocked(costRepo.update).mockResolvedValue(updated as any);
      const { data, error } = await updateCostItem(supabase, ctx, "cost-1", "proj-1", {
        actual_amount: 1100,
      });
      expect(error).toBe("");
      expect(data?.actual_amount).toBe(1100);
    });

    it("returns error when cost item not found", async () => {
      vi.mocked(costRepo.getById).mockResolvedValue(null);
      const { data, error } = await updateCostItem(supabase, ctx, "cost-unknown", "proj-1", {
        actual_amount: 500,
      });
      expect(error).toBe("Cost item not found");
      expect(data).toBeNull();
    });
  });
});
