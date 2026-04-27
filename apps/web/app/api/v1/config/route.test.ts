import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const getTenantContextFromRequest = vi.fn().mockResolvedValue({
  tenantId: "tenant-1",
  userId: "user-1",
  role: "member",
  subscriptionTier: "free",
  clientProfile: "ios_lite",
  traceId: "trace-1",
});

vi.mock("@/lib/tenant", () => ({
  getTenantContextFromRequest: (...args: unknown[]) => getTenantContextFromRequest(...args),
}));

const requestBoundClient = { client: "request-bound" };
const createClientFromRequest = vi.fn().mockResolvedValue(requestBoundClient);
const createClient = vi.fn().mockResolvedValue({ client: "cookie-only" });

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
  createClient: (...args: unknown[]) => createClient(...args),
}));

const getConfigPayload = vi.fn().mockResolvedValue({
  flags: {},
  serverTime: "2026-04-25T00:00:00.000Z",
  traceId: "trace-1",
  clientProfile: "ios_lite",
});

vi.mock("@/lib/platform/flags", () => ({
  getConfigPayload: (...args: unknown[]) => getConfigPayload(...args),
}));

describe("GET /api/v1/config", () => {
  beforeEach(() => {
    createClientFromRequest.mockClear();
    createClient.mockClear();
    getConfigPayload.mockClear();
  });

  it("uses request-bound Supabase client for Bearer-auth feature flag reads", async () => {
    const request = new Request("https://test/api/v1/config", {
      headers: { Authorization: "Bearer user.jwt" },
    });

    const res = await GET(request);

    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(createClient).not.toHaveBeenCalled();
    expect(getConfigPayload).toHaveBeenCalledWith(requestBoundClient, {
      tenantId: "tenant-1",
      traceId: "trace-1",
      clientProfile: "ios_lite",
    });
  });

  it("preserves unauthenticated/cookie fallback behavior through the same helper", async () => {
    const request = new Request("https://test/api/v1/config");

    const res = await GET(request);

    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(createClient).not.toHaveBeenCalled();
  });
});
