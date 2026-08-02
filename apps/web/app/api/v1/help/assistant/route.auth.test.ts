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

import { NextResponse } from "next/server";
import { TenantRequiredError } from "@/lib/tenant";
import { POST as postAssistant } from "../assistant/route";
import { POST as postHints } from "../hints/route";

const ctx = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  userId: "22222222-2222-4222-8222-222222222222",
  role: "member" as const,
  subscriptionTier: "free",
  clientProfile: "web" as const,
  traceId: "t",
};

function req(path: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://aistroyka.ai${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST help assistant/hints auth + abuse", () => {
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
  });

  it("assistant rejects anonymous", async () => {
    mocks.requireTenant.mockImplementation(() => {
      throw new TenantRequiredError("No tenant");
    });
    const res = await postAssistant(req("/api/v1/help/assistant", { query: "hi" }));
    expect(res.status).toBe(401);
  });

  it("hints rejects anonymous", async () => {
    mocks.requireTenant.mockImplementation(() => {
      throw new TenantRequiredError("No tenant");
    });
    const res = await postHints(req("/api/v1/help/hints", { role: "manager" }));
    expect(res.status).toBe(401);
  });

  it("assistant rejects invalid JSON with 400 (no default success)", async () => {
    const res = await postAssistant(
      new Request("https://aistroyka.ai/api/v1/help/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad",
      })
    );
    expect(res.status).toBe(400);
  });

  it("assistant rejects oversize query", async () => {
    const res = await postAssistant(req("/api/v1/help/assistant", { query: "q".repeat(2001) }));
    expect(res.status).toBe(413);
    expect(mocks.releaseLiteIdempotency).toHaveBeenCalled();
  });

  it("assistant returns guidance for authenticated tenant", async () => {
    const res = await postAssistant(
      req("/api/v1/help/assistant", { query: "project", locale: "en", role: "manager" })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.summary).toBeTruthy();
    expect(mocks.storeLiteIdempotency).toHaveBeenCalled();
  });

  it("hints returns list for authenticated tenant", async () => {
    const res = await postHints(req("/api/v1/help/hints", { locale: "en", role: "manager" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(Array.isArray(json.hints)).toBe(true);
  });

  it("assistant returns 429 with stable code/headers", async () => {
    mocks.checkRateLimitStrict.mockResolvedValue({
      ok: false,
      kind: "limited",
      message: "Too many",
      retryAfterSec: 60,
      limit: 30,
    });
    const res = await postAssistant(req("/api/v1/help/assistant", { query: "x" }));
    expect(res.status).toBe(429);
    expect((await res.json()).code).toBe("rate_limit_exceeded");
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("lite completed peek short-circuits without rate charge or store", async () => {
    mocks.peekCompletedLiteIdempotency.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ hints: [{ step: "createProject" }] }, { status: 200 }),
    });
    const res = await postHints(
      req("/api/v1/help/hints", { role: "manager" }, { "x-client": "ios_lite", "x-idempotency-key": "h1" })
    );
    expect(res.status).toBe(200);
    expect(mocks.checkRateLimitStrict).not.toHaveBeenCalled();
    expect(mocks.claimLiteIdempotencyStrict).not.toHaveBeenCalled();
    expect(mocks.storeLiteIdempotency).not.toHaveBeenCalled();
  });
});
