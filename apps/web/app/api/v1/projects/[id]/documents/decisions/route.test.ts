import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    rpc: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: vi.fn().mockResolvedValue(mockSupabase),
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

describe("POST /api/v1/projects/:id/documents/decisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });
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

  it("returns 400 when any document id is not uuid", async () => {
    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve",
        document_ids: ["not-a-uuid"],
      }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(400);
  });

  it("calls rpc and returns aggregate result with deduped ids and per-item failures", async () => {
    const id1 = "11111111-1111-4111-8111-111111111111";
    const id2 = "22222222-2222-4222-8222-222222222222";
    mockSupabase.rpc.mockResolvedValueOnce({
      data: [
        { document_id: id1, ok: true, error: null },
        { document_id: id2, ok: false, error: "Document is not pending decision" },
      ],
      error: null,
    });

    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "reject",
        comment: "Need changes",
        document_ids: [id1, id1, id2],
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

    expect(mockSupabase.rpc).toHaveBeenCalledWith("owner_bulk_decide_documents", {
      p_project_id: "p1",
      p_tenant_id: "t1",
      p_action: "reject",
      p_document_ids: [id1, id2],
      p_comment: "Need changes",
    });
    expect(json.data.total).toBe(2);
    expect(json.data.succeeded_count).toBe(1);
    expect(json.data.failed_count).toBe(1);
    expect(json.data.succeeded_ids).toEqual([id1]);
    expect(json.data.failed).toEqual([
      { document_id: id2, error: "Document is not pending decision" },
    ]);
  });

  it("returns 409 on batch conflict rpc error", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "batch_conflict" },
    });
    const id1 = "11111111-1111-4111-8111-111111111111";
    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", document_ids: [id1] }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(409);
  });

  it("returns 403 on forbidden rpc error", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "forbidden" },
    });
    const id1 = "11111111-1111-4111-8111-111111111111";
    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", document_ids: [id1] }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 401 on not authenticated rpc error", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: { message: "not authenticated" },
    });
    const id1 = "11111111-1111-4111-8111-111111111111";
    const req = new Request("https://x/api/v1/projects/p1/documents/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", document_ids: [id1] }),
    });
    const res = await POST(req, { params: Promise.resolve({ id: "p1" }) });
    expect(res.status).toBe(401);
  });
});
