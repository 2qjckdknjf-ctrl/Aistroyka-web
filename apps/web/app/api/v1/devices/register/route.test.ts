import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { IDEMPOTENCY_KEY_REQUIRED_CODE } from "@/lib/api/lite-idempotency";

const { upsert, idempoSelectChain } = vi.hoisted(() => {
  const u = vi.fn().mockResolvedValue({ error: null });
  const chain: { eq?: ReturnType<typeof vi.fn>; maybeSingle?: ReturnType<typeof vi.fn> } = {};
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  return { upsert: u, idempoSelectChain: chain };
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
    from: vi.fn((table: string) => {
      if (table === "idempotency_keys") {
        return {
          select: vi.fn().mockReturnValue(idempoSelectChain),
          upsert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        upsert: (...args: unknown[]) => upsert(...args),
      };
    }),
  }),
}));

describe("POST /api/v1/devices/register", () => {
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
      new Request("https://test/api/v1/devices/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-client": "ios_lite",
        },
        body: JSON.stringify({
          device_id: "dev-1",
          platform: "ios",
          token: "tok-1",
        }),
      })
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe(IDEMPOTENCY_KEY_REQUIRED_CODE);
  });

  it("returns 200 for ios_lite with idempotency key", async () => {
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
      new Request("https://test/api/v1/devices/register", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-client": "ios_lite",
          "x-idempotency-key": "k-device-reg-1",
        },
        body: JSON.stringify({
          device_id: "dev-1",
          platform: "ios",
          token: "tok-1",
        }),
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(upsert).toHaveBeenCalled();
  });
});
