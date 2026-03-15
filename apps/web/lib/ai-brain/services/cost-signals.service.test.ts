import { describe, it, expect, vi } from "vitest";
import { getCostRiskSignals } from "./cost-signals.service";

vi.mock("@/lib/domain/costs/cost.repository", () => ({
  getBudgetSummary: vi.fn(),
}));

const costRepo = await import("@/lib/domain/costs/cost.repository");
const supabase = {} as any;
const projectId = "proj-1";
const tenantId = "tenant-1";

describe("getCostRiskSignals", () => {
  it("returns empty when no cost items", async () => {
    vi.mocked(costRepo.getBudgetSummary).mockResolvedValue(null);
    const result = await getCostRiskSignals(supabase, projectId, tenantId);
    expect(result).toEqual([]);
  });

  it("returns empty when item_count is 0", async () => {
    vi.mocked(costRepo.getBudgetSummary).mockResolvedValue({
      project_id: projectId,
      tenant_id: tenantId,
      planned_total: 0,
      actual_total: 0,
      currency: "RUB",
      over_budget: false,
      item_count: 0,
    });
    const result = await getCostRiskSignals(supabase, projectId, tenantId);
    expect(result).toEqual([]);
  });

  it("emits budget_overrun when actual exceeds planned", async () => {
    vi.mocked(costRepo.getBudgetSummary).mockResolvedValue({
      project_id: projectId,
      tenant_id: tenantId,
      planned_total: 10000,
      actual_total: 12000,
      currency: "RUB",
      over_budget: true,
      item_count: 3,
    });
    const fromChain = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    };
    const result = await getCostRiskSignals(fromChain as any, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("budget_overrun");
    expect(result[0].severity).toBe("high");
    expect(result[0].title).toBe("Project over budget");
    expect(result[0].description).toContain("12000");
    expect(result[0].description).toContain("10000");
  });

  it("emits cost_pressure when ratio >= 90%", async () => {
    vi.mocked(costRepo.getBudgetSummary).mockResolvedValue({
      project_id: projectId,
      tenant_id: tenantId,
      planned_total: 10000,
      actual_total: 9500,
      currency: "RUB",
      over_budget: false,
      item_count: 2,
    });
    const fromChain = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        }),
      }),
    };
    const result = await getCostRiskSignals(fromChain as any, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("cost_pressure");
    expect(result[0].severity).toBe("medium");
    expect(result[0].title).toBe("Budget pressure");
    expect(result[0].description).toContain("95");
  });

  it("emits cost item overrun when actual > planned for item", async () => {
    vi.mocked(costRepo.getBudgetSummary).mockResolvedValue({
      project_id: projectId,
      tenant_id: tenantId,
      planned_total: 10000,
      actual_total: 5000,
      currency: "RUB",
      over_budget: false,
      item_count: 2,
    });
    const items = [
      { id: "cost-1", title: "Cement", planned_amount: 1000, actual_amount: 1200, currency: "RUB" },
    ];
    const fromChain = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              neq: vi.fn().mockResolvedValue({ data: items, error: null }),
            }),
          }),
        }),
      }),
    };
    const result = await getCostRiskSignals(fromChain as any, projectId, tenantId);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe("cost_pressure");
    expect(result[0].title).toBe("Cost item overrun");
    expect(result[0].description).toContain("Cement");
    expect(result[0].description).toContain("1200");
    expect(result[0].resourceType).toBe("cost_item");
    expect(result[0].resourceId).toBe("cost-1");
  });
});
