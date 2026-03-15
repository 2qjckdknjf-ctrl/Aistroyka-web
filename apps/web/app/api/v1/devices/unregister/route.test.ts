import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

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

vi.mock("@/lib/supabase/server", () => {
  const deleteChain = {
    eq: vi.fn().mockReturnThis(),
    then: vi.fn((fn: (v: { error: null }) => void) => {
      fn({ error: null });
      return Promise.resolve({ error: null });
    }),
    catch: vi.fn(),
  };
  return {
    createClient: vi.fn().mockResolvedValue({
      from: vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue(deleteChain),
      }),
    }),
  };
});

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
  });
});
