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

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/domain/upload-session/upload-session.service", () => ({
  finalizeUploadSession: vi.fn().mockResolvedValue({ ok: true }),
}));

vi.mock("@/lib/api/lite-idempotency", () => ({
  requireLiteIdempotency: vi.fn().mockResolvedValue({ ok: true }),
  storeLiteIdempotency: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/observability", () => ({
  withRequestIdAndTiming: vi.fn((_req, res: Response) => res),
  logStructured: vi.fn(),
  getOrCreateRequestId: vi.fn().mockReturnValue("req-1"),
}));

vi.mock("@/lib/api/request-limit", () => ({
  checkRequestBodySize: vi.fn().mockReturnValue(null),
}));

describe("POST /api/v1/media/upload-sessions/[id]/finalize", () => {
  it("returns 400 when object_path missing", async () => {
    const res = await POST(
      new Request("https://test/api/v1/media/upload-sessions/s1/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  it("returns 400 when object_path empty string", async () => {
    const res = await POST(
      new Request("https://test/api/v1/media/upload-sessions/s1/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ object_path: "" }),
      }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    expect(res.status).toBe(400);
  });

  it("returns 200 when object_path valid", async () => {
    const { finalizeUploadSession } = await import("@/lib/domain/upload-session/upload-session.service");
    vi.mocked(finalizeUploadSession).mockResolvedValueOnce({ ok: true });
    const res = await POST(
      new Request("https://test/api/v1/media/upload-sessions/s1/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ object_path: "tenant/t1/media/m1.jpg" }),
      }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
