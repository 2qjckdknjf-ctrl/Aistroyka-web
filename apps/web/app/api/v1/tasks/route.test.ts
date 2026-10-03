import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { TenantRequiredError } from "@/lib/tenant";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "admin",
  subscriptionTier: "free",
  clientProfile: "ios_manager",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn();
const requireTenant = vi.fn();
const createTask = vi.fn();
const getCachedResponse = vi.fn();
const storeResponse = vi.fn();
const emitAudit = vi.fn();

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
  listTasks: vi.fn(),
  createTask: (...args: unknown[]) => createTask(...args),
}));

vi.mock("@/lib/platform/idempotency/idempotency.service", () => ({
  IDEMPOTENCY_HEADER: "x-idempotency-key",
  getCachedResponse: (...args: unknown[]) => getCachedResponse(...args),
  storeResponse: (...args: unknown[]) => storeResponse(...args),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
}));

function post(body: unknown, headers?: Record<string, string>) {
  return POST(
    new Request("https://test/api/v1/tasks", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    }),
  );
}

describe("POST /api/v1/tasks task_created", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockImplementation(() => undefined);
    createTask.mockReset();
    getCachedResponse.mockReset();
    storeResponse.mockReset();
    emitAudit.mockReset();
    emitAudit.mockResolvedValue(undefined);
    getCachedResponse.mockResolvedValue(null);
    storeResponse.mockResolvedValue(undefined);
  });

  it("writes one task_created row from the authenticated context", async () => {
    createTask.mockResolvedValue({
      data: {
        id: "task-1",
        project_id: "project-1",
        title: "Pour the slab",
        description: "North wing",
        assigned_to: "worker-9",
        due_date: "2026-10-10",
        priority: "high",
      },
      error: "",
    });
    const res = await post({ project_id: "project-1", title: "Pour the slab", description: "North wing" });
    expect(res.status).toBe(201);
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
      user_id: "user-1",
      action: "task_created",
      resource_type: "task",
      resource_id: "task-1",
    });
    expect(payload.details).toMatchObject({
      source: "task_create",
      client: "ios_manager",
      role: "admin",
      has_project: true,
      has_assignee: true,
      has_due_date: true,
      priority: "high",
    });
    expect(JSON.stringify(payload.details)).not.toContain("Pour");
    expect(JSON.stringify(payload.details)).not.toContain("North");
    expect(JSON.stringify(payload.details)).not.toContain("@");
  });

  it("writes nothing when validation fails", async () => {
    const res = await post({ project_id: "project-1" });
    expect(res.status).toBe(400);
    expect(createTask).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("writes nothing when the caller has no tenant", async () => {
    requireTenant.mockImplementation(() => {
      throw new TenantRequiredError();
    });
    const res = await post({ project_id: "project-1", title: "T" });
    expect(res.status).toBe(401);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("writes nothing when the role cannot create tasks", async () => {
    createTask.mockResolvedValue({ data: null, error: "Insufficient rights" });
    const res = await post({ project_id: "project-1", title: "T" });
    expect(res.status).toBe(403);
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("does not write again when the idempotent replay returns the cached task", async () => {
    getCachedResponse.mockResolvedValue({
      statusCode: 201,
      response: { data: { id: "task-1", title: "Pour the slab" } },
    });
    const res = await post(
      { project_id: "project-1", title: "Pour the slab" },
      { "x-idempotency-key": "same-key" },
    );
    expect(res.status).toBe(201);
    expect(createTask).not.toHaveBeenCalled();
    expect(emitAudit).not.toHaveBeenCalled();
  });

  it("still returns the created task when audit insertion throws", async () => {
    createTask.mockResolvedValue({
      data: { id: "task-2", project_id: "project-1", title: "Secret title", priority: "medium" },
      error: "",
    });
    emitAudit.mockRejectedValue(new Error("audit down"));
    const res = await post({ project_id: "project-1", title: "Secret title" });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { data: { id: string } };
    expect(body.data.id).toBe("task-2");
  });
});
