import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH, POST } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_worker",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const markAllRead = vi.fn().mockResolvedValue(3);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  markAllRead: (...args: unknown[]) => markAllRead(...args),
}));

describe("PATCH/POST /api/v1/notifications/read-all", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    markAllRead.mockClear();
    markAllRead.mockResolvedValue(3);
  });

  it("marks unread rows and returns the count", async () => {
    const res = await PATCH(new Request("https://test/api/v1/notifications/read-all", { method: "PATCH" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; marked: number };
    expect(body.ok).toBe(true);
    expect(body.marked).toBe(3);
  });

  it("accepts POST as an alias", async () => {
    const res = await POST(new Request("https://test/api/v1/notifications/read-all", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(markAllRead).toHaveBeenCalled();
  });
});
