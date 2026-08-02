import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { parseAndNormalizeIp } from "./ip-address";
import { createRateLimitMultiMutex } from "./rate-limit-multi.algorithm";
import { rateLimitKey, checkAndIncrementMultiStrict } from "./rate-limit.store";
import {
  HIGH_RISK_ENDPOINTS,
  checkRateLimitStrict,
  RATE_LIMIT_EXCEEDED_CODE,
  rateLimitExceededResponse,
  resolveTrustedClientIp,
  clientIpFromRequest,
  STRICT_PLAN_FLOOR,
} from "./rate-limit.service";
import * as store from "./rate-limit.store";
import * as subscription from "@/lib/platform/subscription/subscription.service";

vi.mock("@/lib/platform/subscription/subscription.service", () => ({
  getLimitsForTenant: vi.fn(),
}));

describe("parseAndNormalizeIp", () => {
  it("accepts canonical IPv4", () => {
    expect(parseAndNormalizeIp("203.0.113.9")).toEqual({
      ok: true,
      family: "ipv4",
      canonical: "203.0.113.9",
    });
  });

  it("rejects out-of-range and leading-zero IPv4", () => {
    expect(parseAndNormalizeIp("999.999.999.999").ok).toBe(false);
    expect(parseAndNormalizeIp("1.2.3.256").ok).toBe(false);
    expect(parseAndNormalizeIp("01.2.3.4").ok).toBe(false);
    expect(parseAndNormalizeIp("....").ok).toBe(false);
  });

  it("normalizes equivalent IPv6 spellings", () => {
    const a = parseAndNormalizeIp("2001:db8::1");
    const b = parseAndNormalizeIp("2001:0db8:0000:0000:0000:0000:0000:0001");
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.canonical).toBe(b.canonical);
  });

  it("rejects malformed IPv6", () => {
    expect(parseAndNormalizeIp("::::").ok).toBe(false);
    expect(parseAndNormalizeIp("gggg::1").ok).toBe(false);
    expect(parseAndNormalizeIp("1::2::3").ok).toBe(false);
  });
});

describe("rate-limit multi algorithm twin (not live DB proof)", () => {
  it("under concurrency admits exactly limit for tenant and charges all-or-nothing", async () => {
    const mutex = createRateLimitMultiMutex();
    const windowStart = "2026-07-25T12:00:00.000Z";
    const results = await Promise.all(
      Array.from({ length: 40 }, () =>
        mutex.run(windowStart, [
          { key: "tenant:t:ep", limit: 7, dimension: "tenant" },
          { key: "user:u:ep", limit: 100, dimension: "user" },
          { key: "ip:1:ep", limit: 100, dimension: "ip" },
        ])
      )
    );
    const allowed = results.filter((r) => r.allowed);
    const limited = results.filter((r) => !r.allowed);
    expect(allowed).toHaveLength(7);
    expect(limited).toHaveLength(33);
    expect(limited.every((r) => r.limited_dimension === "tenant")).toBe(true);
    expect(mutex.slots.get(`tenant:t:ep\0${windowStart}`)).toBe(7);
  });

  it("does not partially charge when a later bucket is limited", async () => {
    const mutex = createRateLimitMultiMutex();
    const windowStart = "2026-07-25T12:00:00.000Z";
    // Fill IP to limit first.
    for (let i = 0; i < 2; i++) {
      await mutex.run(windowStart, [
        { key: "a-tenant", limit: 100, dimension: "tenant" },
        { key: "b-user", limit: 100, dimension: "user" },
        { key: "c-ip", limit: 2, dimension: "ip" },
      ]);
    }
    const beforeTenant = mutex.slots.get(`a-tenant\0${windowStart}`);
    const beforeUser = mutex.slots.get(`b-user\0${windowStart}`);
    const denied = await mutex.run(windowStart, [
      { key: "a-tenant", limit: 100, dimension: "tenant" },
      { key: "b-user", limit: 100, dimension: "user" },
      { key: "c-ip", limit: 2, dimension: "ip" },
    ]);
    expect(denied.allowed).toBe(false);
    expect(denied.limited_dimension).toBe("ip");
    expect(mutex.slots.get(`a-tenant\0${windowStart}`)).toBe(beforeTenant);
    expect(mutex.slots.get(`b-user\0${windowStart}`)).toBe(beforeUser);
  });
});

describe("rate-limit", () => {
  describe("rateLimitKey", () => {
    it("builds tenant key with safe endpoint", () => {
      expect(rateLimitKey("tenant", "t1", "/api/v1/ai/analyze-image")).toBe(
        "tenant:t1:_api_v1_ai_analyze-image"
      );
    });
  });

  describe("HIGH_RISK_ENDPOINTS", () => {
    it("includes analyze-image and login", () => {
      expect(HIGH_RISK_ENDPOINTS).toContain("/api/v1/ai/analyze-image");
      expect(HIGH_RISK_ENDPOINTS).toContain("/api/auth/login");
    });
  });

  describe("resolveTrustedClientIp trust boundary", () => {
    afterEach(() => {
      delete process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
    });

    it("does not trust cf-connecting-ip when Worker trust flag is off (Vercel/local/direct)", () => {
      delete process.env.AISTROYKA_TRUST_CF_CONNECTING_IP;
      const headers = new Headers({ "cf-connecting-ip": "203.0.113.9" });
      expect(resolveTrustedClientIp({ headers })).toMatchObject({
        trustedIp: null,
        reason: "trust_flag_off",
      });
    });

    it("trusts validated cf-connecting-ip only when flag is on", () => {
      process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = "1";
      const headers = new Headers({
        "cf-connecting-ip": "203.0.113.9",
        "x-forwarded-for": "1.2.3.4",
      });
      expect(resolveTrustedClientIp({ headers })).toEqual({
        trustedIp: "203.0.113.9",
        source: "cf-connecting-ip",
        reason: "trusted",
      });
    });

    it("rejects spoofed XFF alone even with trust flag", () => {
      process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = "1";
      const headers = new Headers({ "x-forwarded-for": "8.8.8.8" });
      expect(resolveTrustedClientIp({ headers }).trustedIp).toBeNull();
      expect(clientIpFromRequest(new Request("https://x", { headers }))).toBe("unknown");
    });

    it("rejects malformed cf-connecting-ip under trust flag", () => {
      process.env.AISTROYKA_TRUST_CF_CONNECTING_IP = "1";
      expect(
        resolveTrustedClientIp({ headers: new Headers({ "cf-connecting-ip": "999.999.999.999" }) })
          .trustedIp
      ).toBeNull();
      expect(
        resolveTrustedClientIp({ headers: new Headers({ "cf-connecting-ip": "::::" }) }).trustedIp
      ).toBeNull();
    });
  });

  describe("checkRateLimitStrict", () => {
    beforeEach(() => {
      vi.mocked(subscription.getLimitsForTenant).mockResolvedValue({
        tier: "FREE",
        monthly_ai_budget_usd: 5,
        per_minute_rate_limit_tenant: 10,
        per_minute_rate_limit_ip: 5,
        max_projects: 3,
        max_workers: 2,
        storage_limit_gb: 1,
      });
      vi.spyOn(store, "checkAndIncrementMultiStrict").mockResolvedValue({
        ok: true,
        result: {
          allowed: true,
          limited_dimension: null,
          limited_key: null,
          current_count: null,
          limit: null,
          buckets: [],
        },
      });
    });

    it("returns limited with dimension metadata", async () => {
      vi.spyOn(store, "checkAndIncrementMultiStrict").mockResolvedValueOnce({
        ok: true,
        result: {
          allowed: false,
          limited_dimension: "tenant",
          limited_key: "tenant:t:ep",
          current_count: 10,
          limit: 10,
          buckets: [],
        },
      });
      const result = await checkRateLimitStrict({} as never, {
        tenantId: "t",
        userId: "u",
        ip: "1.1.1.1",
        endpoint: "/api/v1/help/assistant/events",
      });
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected limited");
      expect(result.kind).toBe("limited");
      if (result.kind !== "limited") throw new Error("expected limited");
      expect(result.dimension).toBe("tenant");
      expect(result.limit).toBe(10);
      const res = rateLimitExceededResponse(result);
      expect(res.status).toBe(429);
      expect((await res.json()).code).toBe(RATE_LIMIT_EXCEEDED_CODE);
    });

    it("subscription lookup throw → unavailable (never HELP caps alone)", async () => {
      vi.mocked(subscription.getLimitsForTenant).mockRejectedValue(new Error("db down"));
      const result = await checkRateLimitStrict({} as never, {
        tenantId: "t",
        userId: "u",
        ip: null,
        endpoint: "/api/v1/help/hints",
      });
      expect(result).toEqual({
        ok: false,
        kind: "unavailable",
        message: "Rate limit service unavailable.",
      });
      expect(store.checkAndIncrementMultiStrict).not.toHaveBeenCalled();
    });

    it("uses low FREE plan values under help caps (not raised to 120/60)", async () => {
      const spy = vi.spyOn(store, "checkAndIncrementMultiStrict").mockResolvedValue({
        ok: true,
        result: {
          allowed: true,
          limited_dimension: null,
          limited_key: null,
          current_count: null,
          limit: null,
          buckets: [],
        },
      });
      await checkRateLimitStrict({} as never, {
        tenantId: "t",
        userId: "u",
        ip: "203.0.113.1",
        endpoint: "/api/v1/help/assistant",
      });
      const buckets = spy.mock.calls[0]![1];
      const tenant = buckets.find((b) => b.dimension === "tenant");
      const ipBucket = buckets.find((b) => b.dimension === "ip");
      expect(tenant?.limit).toBe(STRICT_PLAN_FLOOR.per_minute_rate_limit_tenant);
      expect(ipBucket?.limit).toBe(STRICT_PLAN_FLOOR.per_minute_rate_limit_ip);
      expect(tenant?.limit).toBeLessThan(120);
    });

    it("multi RPC error → unavailable without partial charge path", async () => {
      vi.spyOn(store, "checkAndIncrementMultiStrict").mockResolvedValue({
        ok: false,
        reason: "error",
      });
      const result = await checkRateLimitStrict({} as never, {
        tenantId: "t",
        userId: "u",
        ip: null,
        endpoint: "/api/v1/help/assistant",
      });
      expect(result.kind).toBe("unavailable");
    });

    it("skips IP dimension when trusted ip is null; still sends tenant+user", async () => {
      const spy = vi.spyOn(store, "checkAndIncrementMultiStrict").mockResolvedValue({
        ok: true,
        result: {
          allowed: true,
          limited_dimension: null,
          limited_key: null,
          current_count: null,
          limit: null,
          buckets: [],
        },
      });
      await checkRateLimitStrict({} as never, {
        tenantId: "t",
        userId: "u",
        ip: null,
        endpoint: "/api/v1/help/assistant",
      });
      expect(spy.mock.calls[0]![1].map((b) => b.dimension).sort()).toEqual(["tenant", "user"]);
    });
  });

  describe("checkAndIncrementMultiStrict store mapping", () => {
    it("maps returned rpc error to ok:false", async () => {
      const supabase = {
        rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } }),
      };
      const result = await checkAndIncrementMultiStrict(supabase as never, [
        { key: "k", limit: 1, dimension: "tenant" },
      ]);
      expect(result).toEqual({ ok: false, reason: "error" });
    });

    it("maps allowed multi payload", async () => {
      const supabase = {
        rpc: vi.fn().mockResolvedValue({
          data: {
            allowed: true,
            limited_dimension: null,
            limited_key: null,
            current_count: null,
            limit: null,
            buckets: [{ key: "k", dimension: "tenant", limit: 1, current_count: 1 }],
          },
          error: null,
        }),
      };
      const result = await checkAndIncrementMultiStrict(supabase as never, [
        { key: "k", limit: 1, dimension: "tenant" },
      ]);
      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error("expected ok");
      expect(result.result.allowed).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith(
        "rate_limit_try_increment_multi",
        expect.objectContaining({ p_buckets: expect.any(Array) })
      );
    });
  });
});
