import { describe, expect, it } from "vitest";
import { buildDataCoverage, LIVE_SOURCE_CATALOG } from "./roma-live-probes";
import type { LiveProbeBundle } from "./roma-live-probes";

function minimalBundle(partial?: Partial<LiveProbeBundle>): LiveProbeBundle {
  const base: LiveProbeBundle = {
    checkedAt: "2026-07-03T12:00:00.000Z",
    health: { connected: false, summary: "fail", data: null, error: "x" },
    systemHealth: { connected: false, summary: "fail", data: null, error: "x" },
    releaseEnv: { connected: false, summary: "fail", data: null, error: "x" },
    gitMetadata: { connected: false, summary: "fail", data: null, error: "x" },
    storage: { connected: false, summary: "fail", data: null, error: "x" },
    featureFlags: { connected: false, summary: "fail", data: null, error: "x" },
    migrations: { connected: false, summary: "fail", data: null, error: "x" },
    platformAudit: { connected: false, summary: "fail", data: null, error: "x" },
    billing: { connected: false, summary: "fail", data: null, error: "x" },
    ai: { connected: false, summary: "fail", data: null, error: "x" },
    cloudflare: { connected: false, summary: "fail", data: null, error: "x" },
    mobile: { connected: false, summary: "fail", data: null, error: "x" },
    platformIntegration: {
      platformOverview: { connected: false, summary: "skip", data: null, error: "service_role_missing" },
      pushOutbox: { connected: false, summary: "skip", data: null, error: "service_role_missing" },
      billingPlatform: { connected: false, summary: "skip", data: null, error: "service_role_missing" },
    },
  };
  return { ...base, ...partial };
}

describe("roma live probes coverage", () => {
  it("catalog has fixed source count for coverage math", () => {
    expect(LIVE_SOURCE_CATALOG.length).toBe(18);
  });

  it("calculates coverage percent from connected sources", () => {
    const bundle = minimalBundle({
      health: {
        connected: true,
        summary: "ok",
        data: {
          status: 200,
          ok: true,
          db: "ok",
          aiConfigured: true,
          openaiConfigured: true,
          supabaseReachable: true,
          serviceRoleConfigured: true,
          buildSha7: "abc1234",
          buildTime: "2026-07-03T12:00:00.000Z",
          reason: null,
        },
        error: null,
      },
      releaseEnv: {
        connected: true,
        summary: "ok",
        data: {
          isProduction: false,
          criticalMissing: [],
          optionalMissing: [],
          forbiddenInProdSet: [],
          cronConfigured: true,
          aiConfigured: true,
          billingConfigured: true,
          pushConfigured: true,
          results: [],
          verdict: "PASS",
          verdictReason: "ok",
        },
        error: null,
      },
    });
    const { sources, coveragePercent } = buildDataCoverage(bundle);
    expect(sources).toHaveLength(18);
    expect(coveragePercent).toBeGreaterThan(0);
    expect(coveragePercent).toBeLessThanOrEqual(100);
  });

  it("returns zero coverage when all probes unavailable", () => {
    const { coveragePercent, sources } = buildDataCoverage(minimalBundle());
    expect(coveragePercent).toBe(0);
    expect(sources.every((s) => s.status === "unavailable")).toBe(true);
  });
});
