import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  getStripePriceId,
  hasStripePriceMapping,
  validateStripePriceMapping,
  getStripePriceMappingDiagnostics,
  __clearStripePriceCache,
} from "./stripe-price-mapping";

describe("stripe-price-mapping", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    __clearStripePriceCache();
    delete process.env.STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY;
    delete process.env.STRIPE_PRICE_TEAM_CONTRACTOR_ANNUAL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns null when price not configured", () => {
    expect(getStripePriceId("team_contractor", "monthly")).toBeNull();
  });

  it("returns price id when configured", () => {
    process.env.STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY = "price_xxx";
    expect(getStripePriceId("team_contractor", "monthly")).toBe("price_xxx");
  });

  it("hasStripePriceMapping returns false when missing", () => {
    expect(hasStripePriceMapping("team_contractor", "monthly")).toBe(false);
  });

  it("hasStripePriceMapping returns true when configured", () => {
    process.env.STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY = "price_xxx";
    expect(hasStripePriceMapping("team_contractor", "monthly")).toBe(true);
  });

  it("validateStripePriceMapping returns invalid when missing", () => {
    const r = validateStripePriceMapping("team_contractor", "monthly");
    expect(r.valid).toBe(false);
    expect(r.error).toContain("STRIPE_PRICE");
  });

  it("validateStripePriceMapping returns invalid when price too short", () => {
    process.env.STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY = "ab";
    const r = validateStripePriceMapping("team_contractor", "monthly");
    expect(r.valid).toBe(false);
    expect(r.error).toContain("Invalid");
  });

  it("validateStripePriceMapping returns valid when configured", () => {
    process.env.STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY = "price_xxx";
    const r = validateStripePriceMapping("team_contractor", "monthly");
    expect(r.valid).toBe(true);
    expect(r.priceId).toBe("price_xxx");
    expect(r.error).toBeNull();
  });

  it("getStripePriceMappingDiagnostics returns map", () => {
    process.env.STRIPE_PRICE_TEAM_CONTRACTOR_MONTHLY = "price_team_m";
    const diag = getStripePriceMappingDiagnostics();
    expect(diag["team_contractor:monthly"]).toBe("price_team_m");
    expect(diag["team_contractor:annual"]).toBeNull();
  });
});
