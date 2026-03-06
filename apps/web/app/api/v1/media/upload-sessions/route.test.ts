import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const mockRows = [
  {
    id: "s1",
    tenant_id: "t1",
    user_id: "u1",
    purpose: "report_before",
    status: "created",
    created_at: "2025-01-01T00:00:00Z",
    expires_at: "2025-01-02T00:00:00Z",
  },
];

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "t1",
    userId: "u1",
    role: "member",
    subscriptionTier: "free",
    clientProfile: "web",
    traceId: "trace-1",
  }),
  requireTenant: vi.fn(),
  TenantRequiredError: class TenantRequiredError extends Error {
    constructor(m: string) {
      super(m);
      this.name = "TenantRequiredError";
    }
  },
}));

const listForManager = vi.fn().mockResolvedValue({ rows: mockRows, total: 1 });
vi.mock("@/lib/domain/upload-session/upload-session.repository", () => ({
  listForManager: (...args: unknown[]) => listForManager(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

describe("GET /api/v1/media/upload-sessions", () => {
  it("returns 401 when tenant absent", async () => {
    const { getTenantContextFromRequest, requireTenant, TenantRequiredError } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: null,
      userId: null,
      role: null,
      subscriptionTier: null,
      clientProfile: "web",
      traceId: "t",
    });
    vi.mocked(requireTenant).mockImplementationOnce(() => {
      throw new TenantRequiredError("missing");
    });
    const res = await GET(new Request("https://test/api/v1/media/upload-sessions"));
    expect(res.status).toBe(401);
  });

  it("passes stuck=1 as stuck true to repository", async () => {
    listForManager.mockResolvedValueOnce({ rows: [], total: 0 });
    const res = await GET(new Request("https://test/api/v1/media/upload-sessions?stuck=1"));
    expect(res.status).toBe(200);
    expect(listForManager).toHaveBeenCalledWith(
      expect.anything(),
      "t1",
      expect.objectContaining({ stuck: true })
    );
  });

  it("passes stuck_hours to repository when provided", async () => {
    listForManager.mockResolvedValueOnce({ rows: [], total: 0 });
    const res = await GET(new Request("https://test/api/v1/media/upload-sessions?stuck=1&stuck_hours=2"));
    expect(res.status).toBe(200);
    expect(listForManager).toHaveBeenCalledWith(
      expect.anything(),
      "t1",
      expect.objectContaining({ stuck: true, stuckHours: 2 })
    );
  });

  it("does not pass stuck when stuck=0", async () => {
    listForManager.mockResolvedValueOnce({ rows: mockRows, total: 1 });
    const res = await GET(new Request("https://test/api/v1/media/upload-sessions?stuck=0"));
    expect(res.status).toBe(200);
    expect(listForManager).toHaveBeenCalledWith(
      expect.anything(),
      "t1",
      expect.not.objectContaining({ stuck: true })
    );
  });
});
