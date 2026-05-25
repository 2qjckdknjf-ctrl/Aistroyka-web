import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { deleteChain } = vi.hoisted(() => {
  const chain = {
    eq: vi.fn().mockReturnThis(),
    then: vi.fn((fn: (v: { error: null }) => void) => {
      fn({ error: null });
      return Promise.resolve({ error: null });
    }),
    catch: vi.fn(),
  };
  return { deleteChain: chain };
});

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

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue(deleteChain),
    }),
  }),
}));

describe("POST /api/v1/devices/unregister", () => {
  it("returns 400 when device_id missing", async () => {
    const res = await POST(
      new Request("https://test/api/v1/devices/unregister", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when device_id empty", async () => {
    const res = await POST(
      new Request("https://test/api/v1/devices/unregister", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device_id: "" }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for ios_lite without x-idempotency-key", async () => {
    const { getTenantContextFromRequest } = await import("@/lib/tenant");
    vi.mocked(getTenantContextFromRequest).mockResolvedValueOnce({
      tenantId: "t1",
      userId: "u1",
      role: "member",
      subscriptionTier: "free",
      clientProfile: "ios_lite",
      traceId: "trace-1",
    });
    const res = await POST(
      new Request("https://test/api/v1/devices/unregister", {
        method: "POST",
        headers: { "content-type": "application/json", "x-client": "ios_lite" },
        body: JSON.stringify({ device_id: "device-123" }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("idempotency_key_required");
  });

  it("returns 200 when device_id valid", async () => {
    const res = await POST(
      new Request("https://test/api/v1/devices/unregister", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ device_id: "device-123" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ success: true });
    expect(deleteChain.eq).toHaveBeenCalledWith("tenant_id", "t1");
    expect(deleteChain.eq).toHaveBeenCalledWith("user_id", "u1");
    expect(deleteChain.eq).toHaveBeenCalledWith("device_id", "device-123");
  });
});
