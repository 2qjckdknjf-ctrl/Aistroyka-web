import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({ tenantId: "t1", userId: "u1", role: "admin" }),
  requireTenant: vi.fn(),
  TenantRequiredError: class extends Error {
    constructor(m: string) {
      super(m);
      this.name = "TenantRequiredError";
    }
  },
}));
vi.mock("@/lib/api/require-admin", () => ({
  requireAdmin: vi.fn().mockReturnValue(null),
}));
vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));
vi.mock("@/lib/platform/billing-readiness/billing-pilot-resolution.service", () => ({
  getBillingPilotDiagnostics: vi.fn(),
}));

const { getAdminClient } = await import("@/lib/supabase/admin");
const { getBillingPilotDiagnostics } = await import("@/lib/platform/billing-readiness/billing-pilot-resolution.service");

describe("GET /api/v1/admin/billing/pilot-status", () => {
  beforeEach(() => {
    vi.mocked(getAdminClient).mockReturnValue({} as never);
    vi.mocked(getBillingPilotDiagnostics).mockResolvedValue({
      workspaceId: "w1",
      inPilotCohort: true,
      liveCheckoutEligible: true,
      webhookProcessingEligible: true,
      mode: "provider_live",
      reason: "workspace_allowlisted",
      globalProviderEnabled: true,
      globalLiveCheckoutEnabled: true,
      globalWebhookIngressEnabled: true,
      configValid: true,
    });
  });

  it("returns 400 when workspaceId missing", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/pilot-status"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/workspaceId/);
  });

  it("returns 503 when admin client unavailable", async () => {
    vi.mocked(getAdminClient).mockReturnValue(null);
    const { GET } = await import("./route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/pilot-status?workspaceId=w1"));
    expect(res.status).toBe(503);
  });

  it("returns pilot diagnostics when workspaceId provided", async () => {
    const { GET } = await import("./route");
    const res = await GET(new Request("https://x/api/v1/admin/billing/pilot-status?workspaceId=w1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.workspaceId).toBe("w1");
    expect(body.inPilotCohort).toBe(true);
    expect(body.liveCheckoutEligible).toBe(true);
    expect(body.webhookProcessingEligible).toBe(true);
    expect(body.mode).toBe("provider_live");
    expect(body.reason).toBe("workspace_allowlisted");
  });
});
