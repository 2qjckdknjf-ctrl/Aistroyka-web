import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }),
  })),
}));

vi.mock("@/lib/config", () => ({
  hasSupabaseEnv: vi.fn(() => true),
  getPublicConfig: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-test-key",
  })),
}));

vi.mock("@/lib/config/server", () => ({
  getServerConfig: vi.fn(() => ({
    AI_ANALYSIS_URL: "",
    OPENAI_API_KEY: "sk-test-not-for-leak",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-not-for-leak",
  })),
}));

import { getHealthResponse, probeRateLimitRpcStatus } from "./health";

describe("getHealthResponse release stamp contract", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ paths: {} }), {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("allows local/dev without buildStamp", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "");
    const { body, status } = await getHealthResponse();
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.buildStamp).toBeUndefined();
    expect(body.releaseStampRequired).toBe(false);
    expect(body.releaseStampPresent).toBe(false);
  });

  it("fails closed when staging lacks buildStamp", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "");
    const { body, status } = await getHealthResponse();
    expect(status).toBe(503);
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("missing_build_stamp");
    expect(body.releaseStampRequired).toBe(true);
    expect(body.releaseStampPresent).toBe(false);
  });

  it("fails closed when production has malformed stamp", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "unknown");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2026-07-30 00:00");
    const { body, status } = await getHealthResponse();
    expect(status).toBe(503);
    expect(body.reason).toBe("missing_build_stamp");
  });

  it("returns valid stamp and marks RPC missing as degraded", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "staging");
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "a401693ec6915d9014dc45503a2b1a6ae4412ad8");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "2026-07-18 22:29");
    const { body, status } = await getHealthResponse();
    expect(status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.buildStamp).toEqual({
      sha7: "a401693",
      buildTime: "2026-07-18 22:29",
      sha: "a401693ec6915d9014dc45503a2b1a6ae4412ad8",
    });
    expect(body.rateLimitRpcStatus).toBe("missing");
    expect(body.aiOperationalStatus).toBe("degraded");
  });

  it("does not leak secrets in health body", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_BUILD_SHA", "abc1234");
    vi.stubEnv("NEXT_PUBLIC_BUILD_TIME", "t");
    const { body } = await getHealthResponse();
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("sk-test-not-for-leak");
    expect(serialized).not.toContain("service-role-not-for-leak");
    expect(serialized).not.toContain("anon-test-key");
  });
});

describe("probeRateLimitRpcStatus", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reports present when OpenAPI text includes RPC", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response('{"paths":{"/rpc/rate_limit_try_increment_multi":{}}}', { status: 200 })
      )
    );
    await expect(
      probeRateLimitRpcStatus("https://example.supabase.co", "key")
    ).resolves.toBe("present");
  });

  it("reports missing when OpenAPI omits RPC", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"paths":{}}', { status: 200 }))
    );
    await expect(
      probeRateLimitRpcStatus("https://example.supabase.co", "key")
    ).resolves.toBe("missing");
  });
});
