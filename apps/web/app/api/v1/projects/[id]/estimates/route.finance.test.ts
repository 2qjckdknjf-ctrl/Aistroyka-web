import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";
import * as estimates from "@/lib/domain/customer-estimates/customer-estimates.service";
import { expectCustomerFinanceBlocked } from "@/tests/helpers/customer-finance-route-assertions";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "stakeholder",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/customer-estimates/customer-estimates.service", () => ({
  listCustomerEstimates: vi.fn(),
  createCustomerEstimate: vi.fn(),
}));

describe("GET|POST /api/v1/projects/:id/estimates finance", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns safe customer viewer list with commercial fields", async () => {
    vi.mocked(estimates.listCustomerEstimates).mockResolvedValue({
      data: [{ id: "e1", total_amount: 100, currency: "EUR" }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/estimates?viewer=customer"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].total_amount).toBe(100);
    expect(body.data[0].currency).toBe("EUR");
  });

  it("blocks customer viewer leak of actual_amount without leaking key or value", async () => {
    vi.mocked(estimates.listCustomerEstimates).mockResolvedValue({
      data: [{ id: "e1", total_amount: 100, actual_amount: 90 }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/estimates?viewer=customer"), {
      params: Promise.resolve({ id: "p1" }),
    });
    await expectCustomerFinanceBlocked(res, { forbiddenKey: "actual_amount", injectedValue: 90 });
  });

  it("preserves manager GET internal finance fields without customer guard", async () => {
    vi.mocked(estimates.listCustomerEstimates).mockResolvedValue({
      data: [{ id: "e1", total_amount: 100, actual_amount: 90, margin: 10 }] as never,
      error: "",
    });
    const res = await GET(new Request("https://test/api/v1/projects/p1/estimates"), {
      params: Promise.resolve({ id: "p1" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data[0].actual_amount).toBe(90);
    expect(body.data[0].margin).toBe(10);
  });

  it("preserves manager POST create with status 201", async () => {
    vi.mocked(estimates.createCustomerEstimate).mockResolvedValue({
      data: { id: "e1", total_amount: 500, currency: "EUR", margin: 1 } as never,
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/estimates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Quote", total_amount: 500, currency: "EUR" }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.data.total_amount).toBe(500);
    expect(body.data.margin).toBe(1);
  });
});
