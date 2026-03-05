import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  requireLiteIdempotency,
  storeLiteIdempotency,
  IDEMPOTENCY_KEY_REQUIRED_CODE,
} from "./lite-idempotency";
import * as admin from "@/lib/supabase/admin";
import * as idem from "@/lib/platform/idempotency/idempotency.service";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));
vi.mock("@/lib/platform/idempotency/idempotency.service", () => ({
  getCachedResponse: vi.fn(),
  storeResponse: vi.fn(),
  IDEMPOTENCY_HEADER: "x-idempotency-key",
}));

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/v1/worker/day/start", {
    method: "POST",
    headers: new Headers(headers),
  });
}

describe("requireLiteIdempotency", () => {
  beforeEach(() => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as any);
    vi.mocked(idem.getCachedResponse).mockResolvedValue(null);
    vi.mocked(idem.getCachedResponse).mockClear();
  });

  it("returns ok: true for web client (no x-idempotency-key required)", async () => {
    const req = requestWith({ "x-client": "web" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result).toEqual({ ok: true });
    expect(idem.getCachedResponse).not.toHaveBeenCalled();
  });

  it("returns 400 with idempotency_key_required when lite client omits x-idempotency-key", async () => {
    const req = requestWith({ "x-client": "ios_lite" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    const body = await result.response.json();
    expect(body.code).toBe(IDEMPOTENCY_KEY_REQUIRED_CODE);
    expect(result.response.status).toBe(400);
  });

  it("returns ok: true for lite client with key when no cached response", async () => {
    const req = requestWith({ "x-client": "android_lite", "x-idempotency-key": "key-1" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result).toEqual({ ok: true });
    expect(idem.getCachedResponse).toHaveBeenCalledWith({}, "key-1", "t", "u", "POST /r");
  });

  it("returns cached response for lite client when key was already used", async () => {
    vi.mocked(idem.getCachedResponse).mockResolvedValue({
      response: { data: { day_id: "existing" } },
      statusCode: 200,
    });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "key-replay" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    const body = await result.response.json();
    expect(body).toEqual({ data: { day_id: "existing" } });
    expect(result.response.status).toBe(200);
  });

  it("returns ok: true for lite client when tenant/user missing (no cache check)", async () => {
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "key-1" });
    const result = await requireLiteIdempotency(req, {}, "POST /r");
    expect(result).toEqual({ ok: true });
    expect(idem.getCachedResponse).not.toHaveBeenCalled();
  });
});

describe("storeLiteIdempotency", () => {
  beforeEach(() => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as any);
    vi.mocked(idem.storeResponse).mockResolvedValue(undefined);
    vi.mocked(idem.storeResponse).mockClear();
  });

  it("does not call storeResponse for web client", async () => {
    const req = requestWith({ "x-client": "web", "x-idempotency-key": "k" });
    await storeLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { data: 1 }, 200);
    expect(idem.storeResponse).not.toHaveBeenCalled();
  });

  it("calls storeResponse for lite client with key and tenant/user", async () => {
    const req = requestWith({ "x-client": "android_lite", "x-idempotency-key": "key-2" });
    await storeLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { ok: true }, 200);
    expect(idem.storeResponse).toHaveBeenCalledWith({}, "key-2", "t", "u", "POST /r", { ok: true }, 200);
  });

  it("does not call storeResponse when key or tenant/user missing", async () => {
    const req = requestWith({ "x-client": "ios_lite" });
    await storeLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", {}, 200);
    expect(idem.storeResponse).not.toHaveBeenCalled();
  });
});
