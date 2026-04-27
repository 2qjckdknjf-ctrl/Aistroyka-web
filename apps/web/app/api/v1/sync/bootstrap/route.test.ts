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

const requestBoundClient = { client: "request-bound" };
const createClientFromRequest = vi.fn().mockResolvedValue(requestBoundClient);
const createClient = vi.fn().mockResolvedValue({ client: "cookie-only" });

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => createClientFromRequest(...args),
  createClient: (...args: unknown[]) => createClient(...args),
}));

const bootstrap = vi.fn().mockResolvedValue({
  data: {
    tasks: [],
    reports: [],
    uploadSessions: [],
  },
  cursor: 0,
  serverTime: "2026-04-25T00:00:00.000Z",
});

vi.mock("@/lib/sync/sync.service", () => ({
  bootstrap: (...args: unknown[]) => bootstrap(...args),
}));

vi.mock("@/lib/observability", () => ({
  logStructured: vi.fn(),
}));

describe("GET /api/v1/sync/bootstrap", () => {
  beforeEach(() => {
    getTenantContextFromRequest.mockResolvedValue(tenantContext);
    requireTenant.mockReset();
    createClientFromRequest.mockClear();
    createClient.mockClear();
    bootstrap.mockClear();
  });

  it("uses request-bound Supabase client so Bearer auth reaches bootstrap DB reads", async () => {
    const request = new Request("https://test/api/v1/sync/bootstrap", {
      headers: {
        Authorization: "Bearer user.jwt",
        "x-device-id": "device-1",
      },
    });

    const res = await GET(request);

    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(createClient).not.toHaveBeenCalled();
    expect(bootstrap).toHaveBeenCalledWith(requestBoundClient, expect.objectContaining({ tenantId: "tenant-1" }), {
      deviceId: "device-1",
    });
  });

  it("preserves cookie-session requests by still using request-bound client helper", async () => {
    const request = new Request("https://test/api/v1/sync/bootstrap", {
      headers: { "x-device-id": "device-1" },
    });

    const res = await GET(request);

    expect(res.status).toBe(200);
    expect(createClientFromRequest).toHaveBeenCalledWith(request);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("still rejects missing auth or tenant membership", async () => {
    requireTenant.mockImplementationOnce(() => {
      throw new mockClasses.TenantRequiredError("Authentication required");
    });
    const request = new Request("https://test/api/v1/sync/bootstrap", {
      headers: { "x-device-id": "device-1" },
    });

    const res = await GET(request);

    expect(res.status).toBe(401);
    expect(createClientFromRequest).not.toHaveBeenCalled();
  });
});
