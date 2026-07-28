import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const tenantContext = {
  tenantId: "tenant-1",
  userId: "user-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_lite",
  traceId: "trace-1",
};

const getTenantContextFromRequest = vi.fn().mockResolvedValue(tenantContext);
const requireTenant = vi.fn();
const mockClasses = vi.hoisted(() => {
  class TenantRequiredError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TenantRequiredError";
    }
  }
  return { TenantRequiredError };
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
  requireTenant: (...args: unknown[]) => requireTenant(...args),
  TenantRequiredError: mockClasses.TenantRequiredError,
}));

const listTasksForToday = vi.fn().mockResolvedValue({ data: [], error: null });
vi.mock("@/lib/domain/tasks/task.service", () => ({
  listTasksForToday: (...args: unknown[]) => listTasksForToday(...args),
}));

vi.mock("@/lib/observability", () => ({
  getOrCreateTraceId: () => "trace-1",
}));

const createClientFromRequest = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
}));

type QueryResult = { data: unknown; error: { message: string } | null };

function createQueryBuilder(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = vi.fn(self);
  builder.eq = vi.fn(self);
  builder.order = vi.fn(self);
  builder.limit = vi.fn().mockResolvedValue(result);
  return builder;
}

describe("GET /api/v1/worker/sync", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    listTasksForToday.mockResolvedValue({ data: [], error: null });
    createClientFromRequest.mockReset();
  });

  it("includes older changes_requested even when recent query returns 50 newer drafts", async () => {
    const feedback = [
      {
        id: "old-feedback",
        status: "changes_requested",
        created_at: "2026-01-01T00:00:00.000Z",
        submitted_at: "2026-01-02T00:00:00.000Z",
      },
    ];
    const recent = Array.from({ length: 50 }, (_, i) => ({
      id: `draft-${i}`,
      status: "draft",
      created_at: `2026-07-${String((i % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
      submitted_at: null,
    }));

    let reportCalls = 0;
    createClientFromRequest.mockResolvedValue({
      from(table: string) {
        if (table === "worker_reports") {
          reportCalls += 1;
          if (reportCalls === 1) return createQueryBuilder({ data: feedback, error: null });
          return createQueryBuilder({ data: recent, error: null });
        }
        return createQueryBuilder({ data: [], error: null });
      },
    });

    const res = await GET(new Request("https://test/api/v1/worker/sync"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.reports.some((r: { id: string }) => r.id === "old-feedback")).toBe(true);
    expect(body.data.reports[0].id).toBe("old-feedback");
  });

  it("returns 503 when report queries fail instead of empty success", async () => {
    createClientFromRequest.mockResolvedValue({
      from() {
        return createQueryBuilder({ data: null, error: { message: "db down" } });
      },
    });

    const res = await GET(new Request("https://test/api/v1/worker/sync"));
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.error).toBe("reports_unavailable");
  });
});
