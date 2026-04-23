import { describe, expect, it, vi, beforeEach } from "vitest";
import { PATCH } from "./route";
import * as clientPortalService from "@/lib/domain/client-portal/client-portal.service";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));
vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "owner",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));
vi.mock("@/lib/domain/client-portal/client-portal.service", () => ({
  updateClientPortalSettings: vi.fn(),
}));

describe("PATCH /api/v1/projects/:id/client-portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no valid fields", async () => {
    const req = new Request("https://test/api/v1/projects/p1/client-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 403 when policy denies", async () => {
    vi.mocked(clientPortalService.updateClientPortalSettings).mockResolvedValue({
      data: null,
      error: "Insufficient rights",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_portal_enabled: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns data on success", async () => {
    vi.mocked(clientPortalService.updateClientPortalSettings).mockResolvedValue({
      data: { client_portal_enabled: true, client_show_budget_summary: false },
      error: "",
    });
    const req = new Request("https://test/api/v1/projects/p1/client-portal", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_portal_enabled: true }),
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.client_portal_enabled).toBe(true);
  });
});
