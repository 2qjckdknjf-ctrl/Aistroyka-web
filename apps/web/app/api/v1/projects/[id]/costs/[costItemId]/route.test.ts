import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PATCH } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "manager-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "web",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const getCostItemById = vi.fn().mockResolvedValue({
  data: {
    id: "cost-1",
    project_id: "project-1",
    planned_amount: 100,
    actual_amount: 90,
  },
  error: "",
});
const updateCostItem = vi.fn().mockResolvedValue({
  data: {
    id: "cost-1",
    project_id: "project-1",
    planned_amount: 100,
    actual_amount: 120,
    status: "incurred",
  },
  error: "",
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/costs/cost.service", () => ({
  getCostItemById: (...args: unknown[]) => getCostItemById(...args),
  updateCostItem: (...args: unknown[]) => updateCostItem(...args),
}));

describe("GET/PATCH /api/v1/projects/:id/costs/:costItemId", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    getCostItemById.mockResolvedValue({
      data: {
        id: "cost-1",
        project_id: "project-1",
        planned_amount: 100,
        actual_amount: 90,
      },
      error: "",
    });
    updateCostItem.mockResolvedValue({
      data: {
        id: "cost-1",
        project_id: "project-1",
        planned_amount: 100,
        actual_amount: 120,
        status: "incurred",
      },
      error: "",
    });
  });

  it("returns cost item detail for authorized tenant", async () => {
    const res = await GET(new Request("https://test/api/v1/projects/project-1/costs/cost-1"), {
      params: Promise.resolve({ id: "project-1", costItemId: "cost-1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.id).toBe("cost-1");
  });

  it("returns 404 for wrong tenant/project scope", async () => {
    getCostItemById.mockResolvedValueOnce({ data: null, error: "Cost item not found" });
    const res = await GET(new Request("https://test/api/v1/projects/project-1/costs/cost-x"), {
      params: Promise.resolve({ id: "project-1", costItemId: "cost-x" }),
    });
    expect(res.status).toBe(404);
  });

  it("returns 403 when update is denied", async () => {
    updateCostItem.mockResolvedValueOnce({ data: null, error: "Insufficient rights" });
    const res = await PATCH(
      new Request("https://test/api/v1/projects/project-1/costs/cost-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actual_amount: 120 }),
      }),
      { params: Promise.resolve({ id: "project-1", costItemId: "cost-1" }) }
    );
    expect(res.status).toBe(403);
  });

  it("updates planned/actual values and returns normalized payload", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/projects/project-1/costs/cost-1", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planned_amount: "100", actual_amount: "120", status: "incurred" }),
      }),
      { params: Promise.resolve({ id: "project-1", costItemId: "cost-1" }) }
    );
    expect(res.status).toBe(200);
    expect(updateCostItem).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ tenantId: "tenant-1" }),
      "cost-1",
      "project-1",
      expect.objectContaining({ planned_amount: 100, actual_amount: 120, status: "incurred" })
    );
  });
});

