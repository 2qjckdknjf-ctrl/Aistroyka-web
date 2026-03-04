import { describe, expect, it } from "vitest";
import { HealthResponseSchema } from "./health.schema";

describe("HealthResponseSchema", () => {
  it("parses valid health response", () => {
    const data = {
      ok: true,
      db: "ok",
      aiConfigured: true,
      openaiConfigured: true,
      supabaseReachable: true,
      serviceRoleConfigured: true,
    };
    expect(HealthResponseSchema.parse(data)).toEqual(data);
  });
  it("rejects invalid db value", () => {
    expect(() => HealthResponseSchema.parse({ ok: true, db: "x", aiConfigured: true, openaiConfigured: true })).toThrow();
  });
});
