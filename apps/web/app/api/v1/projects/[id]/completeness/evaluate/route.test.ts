import { beforeEach, describe, expect, it, vi } from "vitest";

const getTenantContextFromRequest = vi.fn();
const createClientFromRequest = vi.fn();
const getProjectRow = vi.fn();
const emitAudit = vi.fn();
const persistTradeCompletenessEvaluation = vi.fn();

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest,
  requireTenant: (ctx: { tenantId?: string | null }) => {
    if (!ctx.tenantId) throw Object.assign(new Error("Tenant required"), { name: "TenantRequiredError" });
  },
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(message = "Tenant required") {
      super(message);
      this.name = "TenantRequiredError";
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest,
}));

vi.mock("@/lib/domain/projects/project.repository", () => ({
  getById: (...args: unknown[]) => getProjectRow(...args),
}));

vi.mock("@/lib/observability/audit.service", () => ({
  emitAudit,
}));

vi.mock("@/lib/domain/construction-rules/trade-completeness.service", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/domain/construction-rules/trade-completeness.service")
  >("@/lib/domain/construction-rules/trade-completeness.service");
  return {
    ...actual,
    persistTradeCompletenessEvaluation: (...args: unknown[]) =>
      persistTradeCompletenessEvaluation(...args),
  };
});

describe("POST /api/v1/projects/:id/completeness/evaluate", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "admin",
    });
    createClientFromRequest.mockResolvedValue({
      rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
    });
    getProjectRow.mockResolvedValue({ id: "project-1" });
    persistTradeCompletenessEvaluation.mockResolvedValue({ ok: true, id: "eval-1" });
    emitAudit.mockResolvedValue(undefined);
  });

  it("evaluates inventory and persists result without PASS claim", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          template_id: "trade.waterproofing.wet_area",
          inventory: [{ evidence_kind: "contract_scope", status: "present", source_ref: "c1" }],
        }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { evaluation_id: string; evaluation: { verdict: string } };
    };
    expect(json.data.evaluation_id).toBe("eval-1");
    expect(json.data.evaluation.verdict).toBe("INSUFFICIENT_EVIDENCE");
    expect(JSON.stringify(json)).not.toMatch(/"PASS"/);
    expect(persistTradeCompletenessEvaluation).toHaveBeenCalled();
  });

  it("rejects viewer role", async () => {
    getTenantContextFromRequest.mockResolvedValue({
      tenantId: "tenant-1",
      userId: "user-1",
      role: "viewer",
    });
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inventory: [] }),
      }),
      { params: Promise.resolve({ id: "project-1" }) }
    );
    expect(res.status).toBe(403);
  });
});
