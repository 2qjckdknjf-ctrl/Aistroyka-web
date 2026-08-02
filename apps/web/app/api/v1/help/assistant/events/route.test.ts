import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getTenantContextFromRequest: vi.fn(),
  requireTenant: vi.fn(),
  getAdminClient: vi.fn(),
  checkRateLimitStrict: vi.fn(),
  peekCompletedLiteIdempotency: vi.fn(),
  claimLiteIdempotencyStrict: vi.fn(),
  storeLiteIdempotency: vi.fn(),
  releaseLiteIdempotency: vi.fn(),
  createClientFromRequest: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/tenant", async () => {
  const actual = await vi.importActual<typeof import("@/lib/tenant")>("@/lib/tenant");
  return {
    ...actual,
    getTenantContextFromRequest: (...args: unknown[]) => mocks.getTenantContextFromRequest(...args),
    requireTenant: (...args: unknown[]) => mocks.requireTenant(...args),
  };
});

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: (...args: unknown[]) => mocks.getAdminClient(...args),
}));

vi.mock("@/lib/platform/rate-limit/rate-limit.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/platform/rate-limit/rate-limit.service")>(
    "@/lib/platform/rate-limit/rate-limit.service"
  );
  return {
    ...actual,
    checkRateLimitStrict: (...args: unknown[]) => mocks.checkRateLimitStrict(...args),
  };
});

vi.mock("@/lib/api/lite-idempotency", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/lite-idempotency")>(
    "@/lib/api/lite-idempotency"
  );
  return {
    ...actual,
    peekCompletedLiteIdempotency: (...args: unknown[]) => mocks.peekCompletedLiteIdempotency(...args),
    claimLiteIdempotencyStrict: (...args: unknown[]) => mocks.claimLiteIdempotencyStrict(...args),
    storeLiteIdempotency: (...args: unknown[]) => mocks.storeLiteIdempotency(...args),
    releaseLiteIdempotency: (...args: unknown[]) => mocks.releaseLiteIdempotency(...args),
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClientFromRequest: (...args: unknown[]) => mocks.createClientFromRequest(...args),
}));

import { NextResponse } from "next/server";
import { TenantRequiredError } from "@/lib/tenant";
import { POST } from "./route";

const ctx = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  role: "member" as const,
  subscriptionTier: "free",
  clientProfile: "web" as const,
  traceId: "t",
};

function makeRequest(opts: {
  body?: unknown;
  headers?: Record<string, string>;
  contentLength?: string;
}): Request {
  const headers = new Headers({
    "content-type": "application/json",
    host: "aistroyka.ai",
    ...opts.headers,
  });
  if (opts.contentLength) headers.set("content-length", opts.contentLength);
  return new Request("https://aistroyka.ai/api/v1/help/assistant/events", {
    method: "POST",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

describe("POST /api/v1/help/assistant/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTenantContextFromRequest.mockResolvedValue(ctx);
    mocks.requireTenant.mockImplementation(() => undefined);
    mocks.getAdminClient.mockReturnValue({});
    mocks.checkRateLimitStrict.mockResolvedValue({ ok: true });
    mocks.peekCompletedLiteIdempotency.mockResolvedValue({ ok: true });
    mocks.claimLiteIdempotencyStrict.mockResolvedValue({ ok: true });
    mocks.storeLiteIdempotency.mockResolvedValue({ ok: true });
    mocks.releaseLiteIdempotency.mockResolvedValue({ ok: true });
    mocks.insert.mockResolvedValue({ error: null });
    mocks.createClientFromRequest.mockResolvedValue({
      from: () => ({ insert: (...args: unknown[]) => mocks.insert(...args) }),
    });
  });

  it("rejects anonymous / missing tenant", async () => {
    mocks.requireTenant.mockImplementation(() => {
      throw new TenantRequiredError("No tenant");
    });
    const res = await POST(makeRequest({ body: { type: "open" } }));
    expect(res.status).toBe(401);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects lite missing idempotency key via peek", async () => {
    mocks.peekCompletedLiteIdempotency.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "idempotency_key_required" }, { status: 400 }),
    });
    const res = await POST(
      makeRequest({
        body: { type: "open" },
        headers: { "x-client": "ios_lite" },
      })
    );
    expect(res.status).toBe(400);
    expect(mocks.checkRateLimitStrict).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited after peek", async () => {
    mocks.checkRateLimitStrict.mockResolvedValue({
      ok: false,
      kind: "limited",
      message: "Too many",
      retryAfterSec: 60,
      limit: 30,
    });
    const res = await POST(makeRequest({ body: { type: "open" } }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(mocks.claimLiteIdempotencyStrict).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 503 when rate limit unavailable", async () => {
    mocks.getAdminClient.mockReturnValue(null);
    const res = await POST(makeRequest({ body: { type: "open" } }));
    expect(res.status).toBe(503);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("returns 503 when claim unavailable (strict)", async () => {
    mocks.claimLiteIdempotencyStrict.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "idempotency_unavailable" }, { status: 503 }),
    });
    const res = await POST(
      makeRequest({ body: { type: "ask" }, headers: { "x-client": "android_lite", "x-idempotency-key": "k" } })
    );
    expect(res.status).toBe(503);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("completed peek replay skips rate limit and insert", async () => {
    mocks.peekCompletedLiteIdempotency.mockResolvedValue({
      ok: false,
      response: NextResponse.json(
        { ok: true, accepted: { type: "open", role: "manager", locale: "en", pathname: "/dashboard" } },
        { status: 200 }
      ),
    });
    const res = await POST(
      makeRequest({
        body: { type: "open" },
        headers: { "x-client": "android_lite", "x-idempotency-key": "same" },
      })
    );
    expect(res.status).toBe(200);
    expect(mocks.checkRateLimitStrict).not.toHaveBeenCalled();
    expect(mocks.claimLiteIdempotencyStrict).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects invalid event type before insert", async () => {
    const res = await POST(makeRequest({ body: { type: "explode" } }));
    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
    expect(mocks.releaseLiteIdempotency).toHaveBeenCalled();
  });

  it("rejects oversize content-length before side effects", async () => {
    const res = await POST(makeRequest({ body: { type: "open" }, contentLength: "999999" }));
    expect(res.status).toBe(413);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON", async () => {
    const res = await POST(
      new Request("https://aistroyka.ai/api/v1/help/assistant/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{not-json",
      })
    );
    expect(res.status).toBe(400);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("does not return ok on insert returned error", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "boom", code: "42501" } });
    const res = await POST(makeRequest({ body: { type: "open", role: "manager", locale: "en" } }));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(json.code).toBe("event_insert_failed");
    expect(mocks.storeLiteIdempotency).not.toHaveBeenCalled();
    expect(mocks.releaseLiteIdempotency).toHaveBeenCalled();
  });

  it("finalize failure after insert → 503, not fake 200", async () => {
    mocks.storeLiteIdempotency.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "idempotency_finalize_failed" }, { status: 503 }),
    });
    const res = await POST(
      makeRequest({
        body: { type: "open", role: "manager", locale: "en" },
        headers: { "x-client": "ios_lite", "x-idempotency-key": "evt-fin" },
      })
    );
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("idempotency_finalize_failed");
    expect(mocks.insert).toHaveBeenCalledTimes(1);
  });

  it("release failure after validation error → 503", async () => {
    mocks.releaseLiteIdempotency.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ code: "idempotency_release_failed" }, { status: 503 }),
    });
    const res = await POST(makeRequest({ body: { type: "explode" } }));
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe("idempotency_release_failed");
  });

  it("records event and stores success idempotency on happy path", async () => {
    const res = await POST(
      makeRequest({
        body: { type: "action_click", role: "manager", locale: "en", pathname: "/dashboard", payload: { id: "a" } },
        headers: { "x-client": "ios_lite", "x-idempotency-key": "evt-1" },
      })
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, accepted: { type: "action_click" } });
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.storeLiteIdempotency).toHaveBeenCalled();
  });

  it("passes trusted cf-connecting-ip into rate limit when Worker trust flag is on", async () => {
    const prev = process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
    process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = "1";
    try {
      await POST(
        makeRequest({
          body: { type: "open" },
          headers: {
            "cf-connecting-ip": "203.0.113.50",
            "x-forwarded-for": "8.8.8.8",
          },
        })
      );
      expect(mocks.checkRateLimitStrict).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ ip: "203.0.113.50" })
      );
    } finally {
      if (prev === undefined) delete process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
      else process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = prev;
    }
  });

  it("does not open IP bucket from client-supplied cf-connecting-ip without trust flag", async () => {
    const prev = process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
    delete process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
    try {
      await POST(
        makeRequest({
          body: { type: "open" },
          headers: { "cf-connecting-ip": "203.0.113.50", "x-forwarded-for": "8.8.8.8" },
        })
      );
      expect(mocks.checkRateLimitStrict).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ ip: null })
      );
    } finally {
      if (prev === undefined) delete process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
      else process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = prev;
    }
  });

  it("skips IP bucket when only spoofable headers present", async () => {
    process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = "1";
    await POST(
      makeRequest({
        body: { type: "open" },
        headers: { "x-forwarded-for": "8.8.8.8", "x-real-ip": "1.1.1.1" },
      })
    );
    expect(mocks.checkRateLimitStrict).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ ip: null })
    );
  });
});
