import { describe, expect, it } from "vitest";
import { BuildStampSchema, HealthResponseSchema } from "./health.schema";

describe("HealthResponseSchema", () => {
  it("parses valid health response with buildStamp", () => {
    const data = {
      ok: true,
      db: "ok" as const,
      aiConfigured: true,
      openaiConfigured: true,
      supabaseReachable: true,
      serviceRoleConfigured: true,
      visionProvidersConfigured: ["openai"] as const,
      aiOperationalStatus: "configured_unverified" as const,
      aiLastVerifiedSuccessAt: null,
      rateLimitRpcStatus: "present" as const,
      releaseStampRequired: true,
      releaseStampPresent: true,
      env: "staging",
      buildStamp: { sha7: "a401693", buildTime: "2026-07-18 22:29" },
    };
    expect(HealthResponseSchema.parse(data)).toEqual(data);
  });

  it("allows local health without buildStamp when not required", () => {
    const data = {
      ok: true,
      db: "ok" as const,
      aiConfigured: false,
      openaiConfigured: false,
      releaseStampRequired: false,
      releaseStampPresent: false,
      env: "development",
    };
    expect(HealthResponseSchema.parse(data).buildStamp).toBeUndefined();
  });

  it("rejects invalid db value", () => {
    expect(() =>
      HealthResponseSchema.parse({ ok: true, db: "x", aiConfigured: true, openaiConfigured: true })
    ).toThrow();
  });

  it("rejects malformed sha7", () => {
    expect(() => BuildStampSchema.parse({ sha7: "nothex!", buildTime: "t" })).toThrow();
    expect(() => BuildStampSchema.parse({ sha7: "abc", buildTime: "t" })).toThrow();
  });

  it("rejects empty buildTime", () => {
    expect(() => BuildStampSchema.parse({ sha7: "a401693", buildTime: "" })).toThrow();
  });
});
