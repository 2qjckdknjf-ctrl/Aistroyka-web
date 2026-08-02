import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  IDEMPOTENCY_FINALIZE_FAILED_CODE,
  IDEMPOTENCY_IN_FLIGHT_CODE,
  IDEMPOTENCY_KEY_INVALID_CODE,
  IDEMPOTENCY_KEY_REQUIRED_CODE,
  IDEMPOTENCY_RELEASE_FAILED_CODE,
  IDEMPOTENCY_UNAVAILABLE_CODE,
  MAX_IDEMPOTENCY_KEY_LENGTH,
  peekCompletedLiteIdempotency,
  releaseLiteIdempotency,
  requireLiteIdempotency,
  storeLiteIdempotency,
} from "./lite-idempotency";
import * as admin from "@/lib/supabase/admin";
import * as idem from "@/lib/platform/idempotency/idempotency.service";

vi.mock("@/lib/supabase/admin", () => ({
  getAdminClient: vi.fn(),
}));
vi.mock("@/lib/platform/idempotency/idempotency.service", () => ({
  getCachedResponse: vi.fn(),
  lookupCachedResponse: vi.fn(),
  storeResponse: vi.fn(),
  claimIdempotencySlot: vi.fn(),
  claimIdempotencySlotStrict: vi.fn(),
  finalizeIdempotencySlot: vi.fn(),
  releaseIdempotencySlot: vi.fn(),
  IDEMPOTENCY_HEADER: "x-idempotency-key",
  IDEMPOTENCY_PENDING_STATUS: 0,
}));

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/v1/help/assistant/events", {
    method: "POST",
    headers: new Headers(headers),
  });
}

describe("requireLiteIdempotency legacy", () => {
  beforeEach(() => {
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(idem.getCachedResponse).mockResolvedValue(null);
    vi.clearAllMocks();
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(idem.getCachedResponse).mockResolvedValue(null);
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

  it("returns 400 for blank idempotency key", async () => {
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "   " });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    expect((await result.response.json()).code).toBe(IDEMPOTENCY_KEY_REQUIRED_CODE);
  });

  it("returns 400 for oversize idempotency key", async () => {
    const req = requestWith({
      "x-client": "android_lite",
      "x-idempotency-key": "k".repeat(MAX_IDEMPOTENCY_KEY_LENGTH + 1),
    });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    expect((await result.response.json()).code).toBe(IDEMPOTENCY_KEY_INVALID_CODE);
  });

  it("returns ok: true for android_worker with idempotency key", async () => {
    const req = requestWith({ "x-client": "android_worker", "x-idempotency-key": "key-w" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result).toEqual({ ok: true });
    expect(idem.getCachedResponse).toHaveBeenCalledWith({}, "key-w", "t", "u", "POST /r");
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
    expect(await result.response.json()).toEqual({ data: { day_id: "existing" } });
    expect(result.response.status).toBe(200);
  });

  it("legacy: returns ok: true for lite client when tenant/user missing (no cache check)", async () => {
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "key-1" });
    const result = await requireLiteIdempotency(req, {}, "POST /r");
    expect(result).toEqual({ ok: true });
    expect(idem.getCachedResponse).not.toHaveBeenCalled();
  });

  it("legacy: fail-closed when admin missing", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue(null);
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "key-1" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected unavailable");
    expect(result.response.status).toBe(503);
  });
});

describe("peekCompletedLiteIdempotency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(idem.lookupCachedResponse).mockResolvedValue({ kind: "miss" });
  });

  it("replays completed without claiming", async () => {
    vi.mocked(idem.lookupCachedResponse).mockResolvedValue({
      kind: "hit",
      response: { ok: true },
      status_code: 200,
    });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "replay" });
    const result = await peekCompletedLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected replay");
    expect(result.response.status).toBe(200);
    expect(idem.claimIdempotencySlotStrict).not.toHaveBeenCalled();
  });

  it("DB read error → unavailable (not in-flight)", async () => {
    vi.mocked(idem.lookupCachedResponse).mockResolvedValue({ kind: "error" });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k" });
    const result = await peekCompletedLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected fail");
    expect(result.response.status).toBe(503);
    expect((await result.response.json()).code).toBe(IDEMPOTENCY_UNAVAILABLE_CODE);
  });

  it("expired proceeds (reclaim happens at claim)", async () => {
    vi.mocked(idem.lookupCachedResponse).mockResolvedValue({
      kind: "expired",
      response: null,
      status_code: 0,
    });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k" });
    const result = await peekCompletedLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r");
    expect(result).toEqual({ ok: true });
  });
});

describe("requireLiteIdempotency strict", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({
      kind: "claimed",
      claimToken: "tok-default",
    });
    vi.mocked(idem.getCachedResponse).mockResolvedValue(null);
  });

  it("fail-closed when admin missing", async () => {
    vi.mocked(admin.getAdminClient).mockReturnValue(null);
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k1" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", {
      mode: "strict",
    });
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    expect(result.response.status).toBe(503);
    expect((await result.response.json()).code).toBe(IDEMPOTENCY_UNAVAILABLE_CODE);
  });

  it("fail-closed when tenant context missing", async () => {
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k1" });
    const result = await requireLiteIdempotency(req, {}, "POST /r", { mode: "strict" });
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    expect(result.response.status).toBe(503);
  });

  it("atomic claim: in_flight returns 409", async () => {
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({ kind: "in_flight" });
    const req = requestWith({ "x-client": "android_lite", "x-idempotency-key": "same" });
    const result = await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /events", {
      mode: "strict",
    });
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    expect(result.response.status).toBe(409);
    expect((await result.response.json()).code).toBe(IDEMPOTENCY_IN_FLIGHT_CODE);
  });

  it("atomic claim: completed returns replay body", async () => {
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({
      kind: "completed",
      response: { ok: true, accepted: { type: "open" } },
      statusCode: 200,
    });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "replay" });
    const result = await requireLiteIdempotency(req, { tenantId: "t1", userId: "u1" }, "POST /events", {
      mode: "strict",
    });
    expect(result.ok).toBe(false);
    if (!("response" in result)) throw new Error("expected response");
    expect(result.response.status).toBe(200);
    expect(await result.response.json()).toEqual({ ok: true, accepted: { type: "open" } });
  });

  it("storeLiteIdempotency finalizes strict claim with ownership token", async () => {
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({
      kind: "claimed",
      claimToken: "tok-fin",
    });
    vi.mocked(idem.finalizeIdempotencySlot).mockResolvedValue({ ok: true });
    vi.mocked(idem.releaseIdempotencySlot).mockResolvedValue({ ok: true });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k-fin" });
    await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { mode: "strict" });
    const stored = await storeLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { ok: true }, 200);
    expect(stored.ok).toBe(true);
    expect(idem.finalizeIdempotencySlot).toHaveBeenCalledWith(
      {},
      expect.any(String),
      "t",
      "u",
      "POST /r",
      { ok: true },
      200,
      "tok-fin"
    );

    const reqFail = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k-fail" });
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({
      kind: "claimed",
      claimToken: "tok-fail",
    });
    await requireLiteIdempotency(reqFail, { tenantId: "t", userId: "u" }, "POST /r", { mode: "strict" });
    await storeLiteIdempotency(reqFail, { tenantId: "t", userId: "u" }, "POST /r", { error: true }, 500);
    expect(idem.releaseIdempotencySlot).toHaveBeenCalledWith(
      {},
      expect.any(String),
      "t",
      "u",
      "POST /r",
      "tok-fail"
    );
  });

  it("finalize failure after side effect → 503 finalize failed (no release)", async () => {
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({
      kind: "claimed",
      claimToken: "tok-x",
    });
    vi.mocked(idem.finalizeIdempotencySlot).mockResolvedValue({ ok: false, reason: "error" });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k-fin-fail" });
    await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { mode: "strict" });
    const stored = await storeLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { ok: true }, 200);
    expect(stored.ok).toBe(false);
    if (stored.ok) throw new Error("expected fail");
    expect(stored.response.status).toBe(503);
    expect((await stored.response.json()).code).toBe(IDEMPOTENCY_FINALIZE_FAILED_CODE);
    expect(idem.releaseIdempotencySlot).not.toHaveBeenCalled();
  });

  it("releaseLiteIdempotency returns 503 on release failure", async () => {
    vi.mocked(idem.claimIdempotencySlotStrict).mockResolvedValue({
      kind: "claimed",
      claimToken: "tok-rel",
    });
    vi.mocked(idem.releaseIdempotencySlot).mockResolvedValue({ ok: false, reason: "error" });
    const req = requestWith({ "x-client": "ios_lite", "x-idempotency-key": "k-rel" });
    await requireLiteIdempotency(req, { tenantId: "t", userId: "u" }, "POST /r", { mode: "strict" });
    const released = await releaseLiteIdempotency(req);
    expect(released.ok).toBe(false);
    if (released.ok) throw new Error("expected fail");
    expect(released.response.status).toBe(503);
    expect((await released.response.json()).code).toBe(IDEMPOTENCY_RELEASE_FAILED_CODE);
  });
});

describe("storeLiteIdempotency legacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(admin.getAdminClient).mockReturnValue({} as never);
    vi.mocked(idem.storeResponse).mockResolvedValue(true);
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
});
