import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    subscriptionTier: "pro",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class extends Error {},
}));

vi.mock("@/lib/domain/projects/project-access", () => ({
  requireProjectOwner: vi.fn().mockResolvedValue(undefined),
  ProjectAccessError: class extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/domain/documents/document-decision.service", () => ({
  performOwnerDecision: vi.fn().mockResolvedValue({ error: null }),
}));

describe("POST /api/v1/projects/:id/documents/decisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when action is invalid", async () => {
    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bad", document_ids: ["d1"] }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 400 when bulk item limit exceeded", async () => {
    const ids = Array.from({ length: 21 }, (_, i) => `doc-${i + 1}`);
    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", document_ids: ids }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("returns aggregate result with deduped ids and per-item failures", async () => {
    const { performOwnerDecision } = await import("@/lib/domain/documents/document-decision.service");
    vi.mocked(performOwnerDecision)
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: "not_pending" });

    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        comment: "Need changes",
        document_ids: ["d1", "d1", "d2"],
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(200);

    const json = (await res.json()) as {
      data: {
        total: number;
        succeeded_count: number;
        failed_count: number;
        succeeded_ids: string[];
        failed: Array<{ document_id: string; error: string }>;
      };
    };

    expect(json.data.total).toBe(2);
    expect(json.data.succeeded_count).toBe(1);
    expect(json.data.failed_count).toBe(1);
    expect(json.data.succeeded_ids).toEqual(["d1"]);
    expect(json.data.failed).toEqual([{ document_id: "d2", error: "not_pending" }]);
  });
});
