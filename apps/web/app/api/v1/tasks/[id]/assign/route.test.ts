import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { TenantRequiredError } from "@/lib/tenant";

const WORKER_ID = "11111111-1111-4111-8111-111111111111";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "manager-1",
  role: "admin",
  subscriptionTier: "pro",
  clientProfile: "ios_manager",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn();
const requireTenant = vi.fn();
const assignTask = vi.fn();
const getTaskById = vi.fn();
const getCachedResponse = vi.fn();
const storeResponse = vi.fn();
const emitAudit = vi.fn();
const notifyTenantManagers = vi.fn();
const enqueuePushToUser = vi.fn();

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor() {
      super("Tenant required");
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn(async () => ({ client: "request-bound" })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: () => ({ admin: true }),
}));

vi.mock("@/lib/domain/tasks/task.service", () => ({
  assignTask: (...args: unknown[]) => assignTask(...args),
  getTaskById: (...args: unknown[]) => getTaskById(...args),
}));

vi.mock("@/lib/platform/idempotency/idempotency.service", () => ({
  IDEMPOTENCY_HEADER: "x-idempotency-key",
  getCachedResponse: (...args: unknown[]) => getCachedResponse(...args),
  storeResponse: (...args: unknown[]) => storeResponse(...args),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
}));

vi.mock("@/lib/domain/notifications/manager-notifications.repository", () => ({
  notifyTenantManagers: (...args: unknown[]) => notifyTenantManagers(...args),
}));

vi.mock("@/lib/platform/push/push.service", () => ({
  enqueuePushToUser: (...args: unknown[]) => enqueuePushToUser(...args),
}));

vi.mock("@/lib/observability", () => ({
  withRequestIdAndTiming: (_request: Request, response: Response) => response,
}));

function post(body: unknown, headers?: Record<string, string>, taskId = "task-1") {
  return POST(
    new Request(`https://test/api/v1/tasks/${taskId}/assign`, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: taskId }) },
  );
}

describe("POST /api/v1/tasks/:id/assign task_assignment", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockImplementation(() => undefined);
    assignTask.mockReset();
    getTaskById.mockReset();
    getCachedResponse.mockReset();
    storeResponse.mockReset();
    emitAudit.mockReset();
    notifyTenantManagers.mockReset();
    enqueuePushToUser.mockReset();
    emitAudit.mockResolvedValue(undefined);
    getCachedResponse.mockResolvedValue(null);
    storeResponse.mockResolvedValue(undefined);
    getTaskById.mockResolvedValue({ data: { id: "task-1", project_id: "project-1", title: "Pour the slab" }, error: "" });
    notifyTenantManagers.mockResolvedValue(undefined);
    enqueuePushToUser.mockResolvedValue(0);
  });

  it("writes one task_assignment row from the authenticated context", async () => {
    assignTask.mockResolvedValue({ error: "" });
    const res = await post({ worker_id: WORKER_ID });
    expect(res.status).toBe(200);
    expect(emitAudit).toHaveBeenCalledTimes(1);
    const payload = emitAudit.mock.calls[0]?.[1] as {
      tenant_id: string;
      user_id: string;
      action: string;
      resource_type: string;
      resource_id: string;
      details: Record<string, unknown>;
    };
    expect(payload).toMatchObject({
      tenant_id: "tenant-1",
      user_id: "manager-1",
      action: "task_assignment",
      resource_type: "task",
      resource_id: "task-1",
    });
    expect(payload.details).toMatchObject({
      source: "task_assign",
      client: "ios_manager",
      role: "admin",
      has_assignee: true,
      assignment_changed: true,
      assigned_to: WORKER_ID,
    });
    expect(JSON.stringify(payload.details)).not.toContain("Pour");
    expect(JSON.stringify(payload.details)).not.toContain("@");
  });

  it("writes a second history row on a later legitimate reassignment", async () => {
    assignTask.mockResolvedValue({ error: "" });
    await post({ worker_id: WORKER_ID });
    const secondWorker = "22222222-2222-4222-8222-222222222222";
    await post({ worker_id: secondWorker });
    expect(emitAudit).toHaveBeenCalledTimes(2);
    const second = emitAudit.mock.calls[1]?.[1] as { details: Record<string, unknown> };
    expect(second.details.assigned_to).toBe(secondWorker);
  });

  it("does not store a non-UUID assignee string in details", async () => {
    assignTask.mockResolvedValue({ error: "" });
    const res = await post({ worker_id: "Ivan <ivan@example.com>" });
    expect(res.status).toBe(200);
    const payload = emitAudit.mock.calls[0]?.[1] as { details: Record<string, unknown> };
    expect(payload.details.assigned_to).toBeUndefined();
    expect(JSON.stringify(payload.details)).not.toContain("Ivan");
    expect(JSON.stringify(payload.details)).not.toContain("@");
  });

  it("writes nothing when the caller has no tenant", async () => {
    requireTenant.mockImplementation(() => {
      throw new TenantRequiredError();
    });
    const res = await post({ worker_id: WORKER_ID });
    expect(res.status).toBe(401);
    expect(assignTask).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("writes nothing when the role cannot assign", async () => {
    assignTask.mockResolvedValue({ error: "Insufficient rights" });
    const res = await post({ worker_id: WORKER_ID });
    expect(res.status).toBe(403);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("writes nothing when persistence fails", async () => {
    assignTask.mockResolvedValue({ error: "Assign failed" });
    const res = await post({ worker_id: WORKER_ID });
    expect(res.status).toBe(400);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("does not write again when the idempotent replay returns the cached response", async () => {
    getCachedResponse.mockResolvedValue({
      statusCode: 200,
      response: { ok: true },
    });
    const res = await post({ worker_id: WORKER_ID }, { "x-idempotency-key": "same-key" });
    expect(res.status).toBe(200);
    expect(assignTask).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("still returns ok when audit insertion stalls", async () => {
    assignTask.mockResolvedValue({ error: "" });
    emitAudit.mockImplementation(() => new Promise(() => undefined));
    const started = Date.now();
    const res = await post({ worker_id: WORKER_ID });
    expect(res.status).toBe(200);
    expect(Date.now() - started).toBeLessThan(4000);
  });

  it("still returns ok when audit insertion throws", async () => {
    assignTask.mockResolvedValue({ error: "" });
    emitAudit.mockRejectedValue(new Error("audit down"));
    const res = await post({ worker_id: WORKER_ID });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
