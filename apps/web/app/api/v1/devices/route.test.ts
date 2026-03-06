import { describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: vi.fn().mockResolvedValue({
    tenantId: "tenant-1",
    userId: "user-1",
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

vi.mock("@/lib/supabase/server", () => {
  const rowWithToken = {
    user_id: "user-1",
    device_id: "device-abc",
    platform: "ios",
    created_at: "2025-01-01T00:00:00Z",
    disabled_at: null,
    token: "raw-fcm-token-must-never-leak",
  };
  const listChain = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [rowWithToken], error: null }),
  };
  const countChain = {
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then(resolve: (v: { count: number }) => void) {
      resolve({ count: 1 });
      return Promise.resolve({ count: 1 });
    },
    catch: vi.fn(),
  };
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
          if (opts?.count) return countChain;
          return listChain;
        }),
      }),
    }),
  };
});
vi.mock("@/lib/supabase/admin", () => {
  const rowWithToken = {
    user_id: "user-1",
    device_id: "device-abc",
    platform: "ios",
    created_at: "2025-01-01T00:00:00Z",
    disabled_at: null,
    token: "raw-fcm-token-must-never-leak",
  };
  const listChain = {
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({ data: [rowWithToken], error: null }),
  };
  const countChain = {
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    then(resolve: (v: { count: number }) => void) {
      resolve({ count: 1 });
      return Promise.resolve({ count: 1 });
    },
    catch: vi.fn(),
  };
  return {
    getAdminClient: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
          if (opts?.count) return countChain;
          return listChain;
        }),
      }),
    }),
  };
});

describe("GET /api/v1/devices", () => {
  it("returns 401 when tenant context is absent", async () => {
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
    const res = await GET(new Request("https://test/api/v1/devices"));
    expect(res.status).toBe(401);
  });

  it("never includes push token or token-like fields in response items", async () => {
    const res = await GET(new Request("https://test/api/v1/devices"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: Record<string, unknown>[]; total: number };
    expect(body.data).toHaveLength(1);
    const row = body.data[0];
    expect(row).toHaveProperty("user_id", "user-1");
    expect(row).toHaveProperty("device_id", "device-abc");
    expect(row).toHaveProperty("platform", "ios");
    expect(row).not.toHaveProperty("token");
    expect(row).not.toHaveProperty("fcm_token");
    expect(row).not.toHaveProperty("apns_token");
    expect(row).not.toHaveProperty("push_token");
  });
});
