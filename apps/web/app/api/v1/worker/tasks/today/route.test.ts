import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

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
const listTasksForToday = vi.fn().mockResolvedValue({ data: [], error: null });

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

vi.mock("@/lib/domain/tasks/task.service", () => ({
  listTasksForToday: (...args: unknown[]) => listTasksForToday(...args),
}));

describe("GET /api/v1/worker/tasks/today", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    listTasksForToday.mockResolvedValue({ data: [{ id: "task-1" }], error: null });
  });

  it("returns assigned tasks on success", async () => {
    const res = await GET(new Request("https://test/api/v1/worker/tasks/today"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ data: [{ id: "task-1" }] });
  });

  it("returns 403 when the worker cannot read tasks", async () => {
    listTasksForToday.mockResolvedValueOnce({ data: [], error: "Insufficient rights" });
    const res = await GET(new Request("https://test/api/v1/worker/tasks/today"));
    expect(res.status).toBe(403);
  });

  it("returns 503 when the task query fails so clients keep their cache", async () => {
    listTasksForToday.mockResolvedValueOnce({ data: [], error: "Task list failed" });
    const res = await GET(new Request("https://test/api/v1/worker/tasks/today"));
    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ error: "Task list failed" });
  });
});
