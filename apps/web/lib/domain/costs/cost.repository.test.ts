import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listByProject,
  getById,
  create,
  update,
  getBudgetSummary,
} from "./cost.repository";

function createSupabase(overrides: Partial<{ from: ReturnType<SupabaseClient["from"]> }> = {}): SupabaseClient {
  const from = overrides.from ?? vi.fn();
  return { from: from as SupabaseClient["from"] } as unknown as SupabaseClient;
}

describe("cost.repository", () => {
  describe("listByProject", () => {
    it("returns empty array when no cost items", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await listByProject(supabase, "proj-1", "tenant-1");
      expect(result).toEqual([]);
    });

    it("returns cost items when present", async () => {
      const items = [
        {
          id: "cost-1",
          tenant_id: "tenant-1",
          project_id: "proj-1",
          category: "materials",
          title: "Cement",
          planned_amount: 1000,
          actual_amount: 950,
          currency: "RUB",
          status: "incurred",
          notes: null,
          milestone_id: null,
          created_by: "user-1",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: items, error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await listByProject(supabase, "proj-1", "tenant-1");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("cost-1");
      expect(result[0].planned_amount).toBe(1000);
      expect(result[0].actual_amount).toBe(950);
    });
  });

  describe("getById", () => {
    it("returns null when not found", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await getById(supabase, "cost-1", "tenant-1");
      expect(result).toBeNull();
    });
  });

  describe("getBudgetSummary", () => {
    it("returns null on error", async () => {
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ data: null, error: new Error("db error") }),
              }),
            }),
          }),
        }),
      });
      const result = await getBudgetSummary(supabase, "proj-1", "tenant-1");
      expect(result).toBeNull();
    });

    it("computes planned vs actual totals", async () => {
      const rows = [
        { planned_amount: 1000, actual_amount: 500, currency: "RUB" },
        { planned_amount: 2000, actual_amount: 2100, currency: "RUB" },
      ];
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ data: rows, error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await getBudgetSummary(supabase, "proj-1", "tenant-1");
      expect(result).not.toBeNull();
      expect(result!.planned_total).toBe(3000);
      expect(result!.actual_total).toBe(2600);
      expect(result!.over_budget).toBe(false);
      expect(result!.item_count).toBe(2);
    });

    it("flags over_budget when actual exceeds planned", async () => {
      const rows = [
        { planned_amount: 1000, actual_amount: 1500, currency: "RUB" },
      ];
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                neq: vi.fn().mockResolvedValue({ data: rows, error: null }),
              }),
            }),
          }),
        }),
      });
      const result = await getBudgetSummary(supabase, "proj-1", "tenant-1");
      expect(result!.over_budget).toBe(true);
    });
  });

  describe("create", () => {
    it("creates cost item with required fields", async () => {
      const created = {
        id: "cost-new",
        tenant_id: "tenant-1",
        project_id: "proj-1",
        category: "labor",
        title: "Installation",
        planned_amount: 5000,
        actual_amount: 0,
        currency: "RUB",
        status: "planned",
        notes: null,
        milestone_id: null,
        created_by: "user-1",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: created, error: null }),
            }),
          }),
        }),
      });
      const result = await create(supabase, "tenant-1", "user-1", {
        project_id: "proj-1",
        category: "labor",
        title: "Installation",
        planned_amount: 5000,
      });
      expect(result).not.toBeNull();
      expect(result!.title).toBe("Installation");
      expect(result!.planned_amount).toBe(5000);
    });
  });

  describe("update", () => {
    it("updates cost item fields", async () => {
      const updated = {
        id: "cost-1",
        tenant_id: "tenant-1",
        project_id: "proj-1",
        category: "materials",
        title: "Cement",
        planned_amount: 1000,
        actual_amount: 1100,
        currency: "RUB",
        status: "incurred",
        notes: null,
        milestone_id: null,
        created_by: "user-1",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-02T00:00:00Z",
      };
      const supabase = createSupabase({
        from: vi.fn().mockReturnValue({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updated, error: null }),
                }),
              }),
            }),
          }),
        }),
      });
      const result = await update(supabase, "cost-1", "tenant-1", {
        actual_amount: 1100,
        status: "incurred",
      });
      expect(result?.actual_amount).toBe(1100);
      expect(result?.status).toBe("incurred");
    });
  });
});
