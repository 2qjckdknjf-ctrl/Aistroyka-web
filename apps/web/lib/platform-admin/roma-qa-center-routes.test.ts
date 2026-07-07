import { describe, expect, it } from "vitest";
import {
  ROMA_QA_CENTER_CANONICAL_ROUTES,
  ROMA_QA_CENTER_LEGACY_REDIRECTS,
  getRomaLegacyRedirectTarget,
  isRomaQaCenterPlatformSectionId,
} from "./roma-qa-center-routes";

describe("roma-qa-center-routes", () => {
  it("redirects legacy V1 sections to canonical module routes", () => {
    expect(getRomaLegacyRedirectTarget("audits")).toBe("/platform-admin/testing/safe-audit");
    expect(getRomaLegacyRedirectTarget("history")).toBe("/platform-admin/testing/audit-runs");
    expect(getRomaLegacyRedirectTarget("regression")).toBe("/platform-admin/testing/change-intelligence");
    expect(getRomaLegacyRedirectTarget("coverage")).toBe("/platform-admin/testing/quality-graph");
    expect(getRomaLegacyRedirectTarget("performance")).toBe("/platform-admin/testing");
    expect(getRomaLegacyRedirectTarget("reports")).toBe("/platform-admin/testing");
  });

  it("keeps platform domain sections as canonical [section] routes", () => {
    for (const id of ["web", "mobile", "backend", "ai", "security"] as const) {
      expect(isRomaQaCenterPlatformSectionId(id)).toBe(true);
      expect(getRomaLegacyRedirectTarget(id)).toBeUndefined();
    }
  });

  it("does not redirect unknown slugs", () => {
    expect(getRomaLegacyRedirectTarget("unknown-slug")).toBeUndefined();
  });

  it("exposes one canonical route per ROMA feature", () => {
    const routes = Object.values(ROMA_QA_CENTER_CANONICAL_ROUTES);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes).toContain("/platform-admin/testing/safe-audit");
    expect(routes).toContain("/platform-admin/testing/audit-runs");
  });

  it("legacy redirect targets are canonical routes", () => {
    const canonical = new Set(Object.values(ROMA_QA_CENTER_CANONICAL_ROUTES));
    for (const target of Object.values(ROMA_QA_CENTER_LEGACY_REDIRECTS)) {
      expect(canonical.has(target)).toBe(true);
    }
  });
});
