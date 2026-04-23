import { describe, expect, it } from "vitest";
import { tierToPlanCode, mapLegacyTierToPlan, LEGACY_TIERS } from "./bridge";

describe("legacy tier → canonical plan bridge", () => {
  describe("tierToPlanCode", () => {
    it("maps FREE to client_personal", () => {
      expect(tierToPlanCode("FREE")).toBe("client_personal");
    });
    it("maps PRO to team_contractor", () => {
      expect(tierToPlanCode("PRO")).toBe("team_contractor");
    });
    it("maps ENTERPRISE to enterprise", () => {
      expect(tierToPlanCode("ENTERPRISE")).toBe("enterprise");
    });
  });

  describe("mapLegacyTierToPlan", () => {
    it("returns planCode and source legacy_tier_bridge for FREE", () => {
      const r = mapLegacyTierToPlan("FREE");
      expect(r.planCode).toBe("client_personal");
      expect(r.source).toBe("legacy_tier_bridge");
      expect(r.legacyTier).toBe("FREE");
    });
    it("returns planCode and source for PRO", () => {
      const r = mapLegacyTierToPlan("PRO");
      expect(r.planCode).toBe("team_contractor");
      expect(r.legacyTier).toBe("PRO");
    });
    it("returns enterprise for ENTERPRISE", () => {
      const r = mapLegacyTierToPlan("ENTERPRISE");
      expect(r.planCode).toBe("enterprise");
      expect(r.legacyTier).toBe("ENTERPRISE");
    });
  });

  describe("LEGACY_TIERS", () => {
    it("includes all three tiers", () => {
      expect(LEGACY_TIERS).toEqual(["FREE", "PRO", "ENTERPRISE"]);
    });
  });
});
