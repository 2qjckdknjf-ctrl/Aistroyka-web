import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const emitAudit = vi.fn();
const listAuditLogsByAction = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    userId: "user-1",
    role: "admin",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));

vi.mock("@/lib/domain/tasks/task.policy", () => ({
  canManageTasks: vi.fn().mockReturnValue(true),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit: (...args: unknown[]) => emitAudit(...args),
  listAuditLogsByAction: (...args: unknown[]) => listAuditLogsByAction(...args),
}));

describe("POST /api/v1/ai/risk-decisions", () => {
  beforeEach(() => {
    emitAudit.mockReset().mockResolvedValue(undefined);
  });

  it("persists accept without budget fields", async () => {
    const res = await POST(
      new Request("https://test/api/v1/ai/risk-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: "job-1",
          decision: "accept",
          comment: "ok",
          title: "Supply risk",
          budget_impact: 999,
        }),
      })
    );
    expect(res.status).toBe(201);
    expect(emitAudit).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        action: "ai_risk_decision",
        resource_type: "ai_job",
        resource_id: "job-1",
        details: expect.not.objectContaining({ budget_impact: 999 }),
      })
    );
    const body = (await res.json()) as { data: { decision: string } };
    expect(body.data.decision).toBe("accept");
  });

  it("rejects unknown decision", async () => {
    const res = await POST(
      new Request("https://test/api/v1/ai/risk-decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: "job-1", decision: "maybe" }),
      })
    );
    expect(res.status).toBe(400);
    expect(emitAudit).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/ai/risk-decisions", () => {
  beforeEach(() => {
    listAuditLogsByAction.mockReset();
  });

  it("maps audit rows", async () => {
    listAuditLogsByAction.mockResolvedValue([
      {
        id: "a1",
        tenant_id: "tenant-1",
        user_id: "user-1",
        trace_id: null,
        action: "ai_risk_decision",
        resource_type: "ai_job",
        resource_id: "job-1",
        details: { decision: "reject", comment: "no", title: "Risk" },
        created_at: "2026-08-25T00:00:00Z",
      },
    ]);
    const res = await GET(new Request("https://test/api/v1/ai/risk-decisions"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      data: [
        {
          id: "a1",
          job_id: "job-1",
          decision: "reject",
          comment: "no",
          title: "Risk",
          actor: "user-1",
          created_at: "2026-08-25T00:00:00Z",
        },
      ],
    });
  });
});
