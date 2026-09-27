import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "web",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const openFactsForUser = vi.fn();
const recordNotificationOpened = vi.fn();

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
  TenantForbiddenError: class TenantForbiddenError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(async () => ({ client: "request-bound" })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => null,
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  openFactsForUser: (...args: unknown[]) => openFactsForUser(...args),
}));

vi.mock("@/lib/growth/product-events", () => ({
  recordNotificationOpened: (...args: unknown[]) => recordNotificationOpened(...args),
}));

describe("POST /api/v1/notifications/:id/opened", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    openFactsForUser.mockReset();
    recordNotificationOpened.mockReset();
    recordNotificationOpened.mockResolvedValue(undefined);
  });

  it("writes notification_opened for an owned row and still returns ok if telemetry throws", async () => {
    openFactsForUser.mockResolvedValue({ type: "task_assigned", target_type: "task" });
    const res = await POST(new Request("https://test/api/v1/notifications/n1/opened", { method: "POST" }), {
      params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }),
    });
    expect(res.status).toBe(200);
    expect(recordNotificationOpened).toHaveBeenCalledWith(
      expect.objectContaining({
        notificationType: "task_assigned",
        destinationKind: "task",
        role: "member",
      }),
    );

    recordNotificationOpened.mockRejectedValue(new Error("audit down"));
    const again = await POST(new Request("https://test/api/v1/notifications/n1/opened", { method: "POST" }), {
      params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }),
    });
    expect(again.status).toBe(200);
  });

  it("does not write when the notification is not owned", async () => {
    openFactsForUser.mockResolvedValue(null);
    const res = await POST(new Request("https://test/api/v1/notifications/missing/opened", { method: "POST" }), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
    expect(recordNotificationOpened).not.toHaveBeenCalled();
  });
});
