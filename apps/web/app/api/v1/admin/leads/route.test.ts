import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({ tenantId: "t1", userId: "u1", role: "admin" }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {},
}));
vi.mock("@/lib/api/require-admin", () => ({
  requireAdmin: vi.fn().mockReturnValue(null),
}));

const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe("GET /api/v1/admin/leads", () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      order: mockOrder,
    });
    mockOrder.mockReturnValue({
      limit: mockLimit,
      eq: mockEq,
    });
    mockLimit.mockResolvedValue({
      data: [
        {
          id: "lead-1",
          created_at: "2026-03-19T12:00:00Z",
          name: "Alice",
          email: "alice@example.com",
          company: "Co",
          message: "Hi",
          source: "contact_form",
          status: "new",
          notes: null,
        },
      ],
      error: null,
    });
    mockEq.mockReturnValue({ limit: mockLimit });
  });

  it("returns 200 with leads list", async () => {
    const req = new Request("http://x/api/v1/admin/leads");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].name).toBe("Alice");
    expect(body.data[0].status).toBe("new");
    expect(body.data[0].source).toBe("contact_form");
  });

  it("returns 401 when requireTenant throws", async () => {
    const { getTenantContextFromRequest, requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(requireTenant).mockImplementationOnce(() => {
      throw new TenantRequiredError("Auth required");
    });
    const req = new Request("http://x/api/v1/admin/leads");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 403 when requireAdmin returns error", async () => {
    const { requireAdmin } = await import("@/lib/api/require-admin");
    vi.mocked(requireAdmin).mockReturnValueOnce(
      new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 })
    );
    const req = new Request("http://x/api/v1/admin/leads");
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it("returns 503 when getAdminClient is null", async () => {
    const { getAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(getAdminClient).mockReturnValueOnce(null as never);
    const req = new Request("http://x/api/v1/admin/leads");
    const res = await GET(req);
    expect(res.status).toBe(503);
  });
});
