import { describe, expect, it } from "vitest";
import {
  ROMA_PATH_DOMAIN_RULES,
  isSecuritySensitiveChange,
  matchPathToAreaIds,
  matchPathToCatalogDomains,
  matchPathsToAreaIds,
  matchPathsToCatalogDomains,
} from "./roma-path-domain-rules";

describe("roma-path-domain-rules", () => {
  it("maps platform-admin paths to areas and catalog domains", () => {
    expect(matchPathToAreaIds("apps/web/app/platform-admin/testing/page.tsx")).toEqual([
      "pa-platform-admin",
      "pa-roma-qa-center",
    ]);
    expect(matchPathToCatalogDomains("apps/web/lib/platform-admin/roma-qa-center-nav.ts")).toEqual(
      expect.arrayContaining(["security", "web", "release"])
    );
  });

  it("maps mobile paths consistently", () => {
    expect(matchPathToAreaIds("ios/Shared/Auth.swift")).toEqual(
      expect.arrayContaining(["pa-worker-reports", "pa-manager-review"])
    );
    expect(matchPathToCatalogDomains("android/worker/MainActivity.kt")).toEqual(["mobile_android"]);
  });

  it("aggregates paths without duplicate ids", () => {
    const areas = matchPathsToAreaIds([
      "apps/web/middleware.ts",
      "apps/web/lib/platform-admin/roma-quality-graph.ts",
    ]);
    expect(areas).toContain("pa-authentication");
    expect(areas).toContain("pa-platform-admin");
    expect(new Set(areas).size).toBe(areas.length);
  });

  it("detects security-sensitive changes", () => {
    expect(isSecuritySensitiveChange(["apps/web/middleware.ts"])).toBe(true);
    expect(isSecuritySensitiveChange(["docs/readme.md"])).toBe(false);
  });

  it("defines stable rule ids", () => {
    const ids = ROMA_PATH_DOMAIN_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(10);
  });

  it("change intelligence and quality graph share the same path source", () => {
    const path = "apps/web/app/api/v1/reports/route.ts";
    expect(matchPathsToCatalogDomains([path])).toEqual(
      expect.arrayContaining(["backend", "business_flow"])
    );
    expect(matchPathsToAreaIds([path])).toContain("pa-worker-reports");
  });
});
