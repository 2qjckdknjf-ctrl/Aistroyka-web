import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

const recordNotificationOpened = vi.fn();
const markRead = vi.fn().mockResolvedValue(true);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn(async () => ({
    tenantId: "tenant-1",
    userId: "user-1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace-1",
  })),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(async () => ({ client: "request-bound" })),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  markRead: (...args: unknown[]) => markRead(...args),
}));

vi.mock("@/lib/growth/product-events", () => ({
  recordNotificationOpened: (...args: unknown[]) => recordNotificationOpened(...args),
}));

describe("PATCH /api/v1/notifications/:id/read", () => {
  beforeEach(() => {
    markRead.mockClear();
    recordNotificationOpened.mockClear();
  });

  it("marks the row read and does not record an open", async () => {
    const res = await PATCH(new Request("https://test/api/v1/notifications/n1/read", { method: "PATCH" }), {
      params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }),
    });
    expect(res.status).toBe(200);
    expect(markRead).toHaveBeenCalled();
    expect(recordNotificationOpened).not.toHaveBeenCalled();
  });
});
