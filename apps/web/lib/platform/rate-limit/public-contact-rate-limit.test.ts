import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTACT_MAX_BODY_BYTES,
  PUBLIC_CONTACT_ENDPOINT,
  PUBLIC_CONTACT_IP_LIMIT,
  checkPublicContactRateLimit,
} from "./public-contact-rate-limit";
import { rateLimitKey } from "./rate-limit.store";
import { RATE_LIMIT_EXCEEDED_CODE, RATE_LIMIT_UNAVAILABLE_CODE } from "./rate-limit.service";

describe("public-contact-rate-limit", () => {
  it("exports stable endpoint, limit, and body-size contract", () => {
    expect(PUBLIC_CONTACT_ENDPOINT).toBe("/api/v1/contact");
    expect(PUBLIC_CONTACT_IP_LIMIT).toBe(5);
    expect(CONTACT_MAX_BODY_BYTES).toBe(16_384);
    expect(RATE_LIMIT_EXCEEDED_CODE).toBe("rate_limit_exceeded");
    expect(RATE_LIMIT_UNAVAILABLE_CODE).toBe("rate_limit_unavailable");
  });

  it("builds privacy-safe IP keys without email/message PII", () => {
    const key = rateLimitKey("ip", "203.0.113.10", PUBLIC_CONTACT_ENDPOINT);
    expect(key).toMatch(/^ip:203\.0\.113\.10:/);
    expect(key).not.toMatch(/@|message|email/i);
  });

  it("fails closed on empty trusted IP", async () => {
    const rpc = vi.fn();
    const result = await checkPublicContactRateLimit({ rpc } as never, "  ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("unavailable");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("fails closed when RPC errors", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
    };
    const result = await checkPublicContactRateLimit(supabase as never, "203.0.113.10");
    expect(result).toEqual({
      ok: false,
      kind: "unavailable",
      message: "Rate limit service unavailable.",
    });
  });

  it("fails closed on malformed RPC payload", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({ data: {}, error: null }),
    };
    const result = await checkPublicContactRateLimit(supabase as never, "203.0.113.10");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("unavailable");
  });

  it("returns limited when allowed=false", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: { allowed: false, current_count: 6 },
        error: null,
      }),
    };
    const result = await checkPublicContactRateLimit(supabase as never, "203.0.113.10");
    expect(result).toMatchObject({
      ok: false,
      kind: "limited",
      dimension: "ip",
      limit: PUBLIC_CONTACT_IP_LIMIT,
      retryAfterSec: 60,
    });
  });

  it("allows when RPC returns allowed=true", async () => {
    const supabase = {
      rpc: vi.fn().mockResolvedValue({
        data: [{ allowed: true, current_count: 1 }],
        error: null,
      }),
    };
    const result = await checkPublicContactRateLimit(supabase as never, "2001:db8::1");
    expect(result).toEqual({ ok: true });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "rate_limit_try_increment",
      expect.objectContaining({
        p_key: rateLimitKey("ip", "2001:db8::1", PUBLIC_CONTACT_ENDPOINT),
        p_limit: PUBLIC_CONTACT_IP_LIMIT,
      })
    );
  });
});
