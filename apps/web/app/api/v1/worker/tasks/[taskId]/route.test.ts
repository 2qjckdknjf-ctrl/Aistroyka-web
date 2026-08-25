import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "worker-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_worker",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const createClientFromRequest = vi.fn().mockResolvedValue({ client: "request-bound" });
const startAssignedTask = vi.fn().mockResolvedValue({
  data: { id: "task-1", status: "in_progress", title: "Frame" },
  error: "",
});
const requireLiteIdempotency = vi.fn().mockResolvedValue({ ok: true });
const storeLiteIdempotency = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/tasks/task.service", () => ({
  startAssignedTask: (...args: unknown[]) => startAssignedTask(...args),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: (...args: unknown[]) => requireLiteIdempotency(...args),
  storeLiteIdempotency: (...args: unknown[]) => storeLiteIdempotency(...args),
}));

describe("PATCH /api/v1/worker/tasks/:taskId", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    startAssignedTask.mockClear();
    requireLiteIdempotency.mockResolvedValue({ ok: true });
  });

  it("marks the assigned task in_progress", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/worker/tasks/task-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-1" },
        body: JSON.stringify({ status: "in_progress" }),
      }),
      { params: Promise.resolve({ taskId: "task-1" }) }
    );
    expect(res.status).toBe(200);
    expect(startAssignedTask).toHaveBeenCalled();
    expect(storeLiteIdempotency).toHaveBeenCalled();
  });

  it("rejects other statuses", async () => {
    const res = await PATCH(
      new Request("https://test/api/v1/worker/tasks/task-1", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-idempotency-key": "k-2" },
        body: JSON.stringify({ status: "done" }),
      }),
      { params: Promise.resolve({ taskId: "task-1" }) }
    );
    expect(res.status).toBe(400);
    expect(startAssignedTask).not.toHaveBeenCalled();
  });
});
