import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getTestCatalog } from "./roma-test-catalog";
import {
  analyzeChangeSet,
  calculateChangeRisk,
  explainChangeImpact,
  getAffectedGraphNodes,
  getChangeIntelligenceEngine,
  selectTestsForChange,
} from "./roma-change-intelligence";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

const CATALOG_IDS = new Set(getTestCatalog().items.map((i) => i.testId));

describe("ROMA Change Intelligence V1", () => {
  it("engine has execution disabled", () => {
    const engine = getChangeIntelligenceEngine();
    expect(engine.executionEnabled).toBe(false);
    expect(engine.version).toBe("v1");
  });

  it("reports API change selects reports/backend/mobile/storage tests", () => {
    const input = {
      changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/Sync/ReportSync.swift"],
      changedApis: ["api-reports", "api-upload-storage"],
      changedMobileApps: ["ios-worker"],
    };
    const result = analyzeChangeSet(input);
    expect(result.affectedAreas).toContain("pa-worker-reports");
    expect(result.requiredTestDomains).toEqual(
      expect.arrayContaining(["backend", "business_flow", "mobile_ios", "mobile_android"])
    );
    const tests = selectTestsForChange(input);
    expect(tests).toContain("backend-api-reports-crud");
    expect(tests).toContain("ios-worker-report-sync");
    expect(tests.every((id) => CATALOG_IDS.has(id))).toBe(true);
  });

  it("auth middleware change selects security/RBAC/release tests", () => {
    const input = {
      changedPaths: ["apps/web/middleware.ts", "apps/web/lib/supabase/session.ts"],
      changedModules: ["auth"],
    };
    const result = analyzeChangeSet(input);
    expect(result.affectedAreas).toContain("pa-authentication");
    expect(result.requiredTestDomains).toEqual(expect.arrayContaining(["security", "backend", "web", "release"]));
    const tests = selectTestsForChange(input);
    expect(tests.some((id) => id.startsWith("sec-") || id.startsWith("backend-api-auth"))).toBe(true);
  });

  it("platform-admin change selects platform admin/security tests", () => {
    const input = {
      changedPaths: ["apps/web/lib/platform-admin/shell-nav.ts"],
      changedModules: ["platform-admin"],
    };
    const result = analyzeChangeSet(input);
    expect(result.affectedAreas).toContain("pa-platform-admin");
    expect(result.affectedAreas).toContain("pa-roma-qa-center");
    expect(result.requiredTestDomains).toEqual(expect.arrayContaining(["security", "web", "release"]));
    const tests = selectTestsForChange(input);
    expect(tests).toContain("sec-rbac-platform-owner-grant");
  });

  it("AI change selects AI/backend/security tests", () => {
    const input = {
      changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
      changedApis: ["api-ai"],
      changedModules: ["copilot"],
    };
    const result = analyzeChangeSet(input);
    expect(result.affectedAreas).toContain("pa-ai-copilot");
    expect(result.requiredTestDomains).toEqual(expect.arrayContaining(["ai", "backend", "security"]));
    const tests = selectTestsForChange(input);
    expect(tests.some((id) => id.startsWith("ai-"))).toBe(true);
  });

  it("docs-only change is low risk with no release-critical tests", () => {
    const input = { changedPaths: ["docs/launch/P4_PROJECT_SETUP_RUNBOOK.md"] };
    const result = analyzeChangeSet(input);
    expect(result.releaseImpact).toBe("none");
    expect(result.confidence).toBe("low");
    expect(result.requiredTestDomains.length).toBe(0);
    const tests = selectTestsForChange(input);
    const catalog = getTestCatalog();
    for (const testId of tests) {
      const item = catalog.items.find((i) => i.testId === testId);
      expect(item?.releaseCritical).toBe(false);
    }
  });

  it("unknown path returns unknown confidence with no areas", () => {
    const input = { changedPaths: ["tools/experimental/unknown-module.ts"] };
    const result = analyzeChangeSet(input);
    expect(result.affectedAreas.length).toBe(0);
    expect(result.confidence).toBe("unknown");
    expect(result.explanation).toMatch(/UNKNOWN/i);
    expect(calculateChangeRisk(input)).toBe("unknown");
  });

  it("selected tests come from Test Catalog", () => {
    const tests = selectTestsForChange({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts"],
      changedApis: ["api-reports"],
    });
    expect(tests.length).toBeGreaterThan(0);
    expect(tests.every((id) => CATALOG_IDS.has(id))).toBe(true);
  });

  it("affected areas come from Quality Graph", () => {
    const nodes = getAffectedGraphNodes({
      changedPaths: ["apps/web/lib/platform-admin/testing/page.tsx"],
      changedModules: ["platform-admin"],
    });
    expect(nodes.some((n) => n.startsWith("pa-"))).toBe(true);
  });

  it("explainChangeImpact returns readable summary", () => {
    const text = explainChangeImpact({
      changedPaths: ["apps/web/middleware.ts"],
      changedModules: ["auth"],
    });
    expect(text).toMatch(/Release impact/i);
    expect(text).toMatch(/Confidence/i);
  });

  it("has no external calls or execution endpoints", () => {
    const src = readRelative("lib/platform-admin/roma-change-intelligence.ts");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/process\.env/);
    expect(getChangeIntelligenceEngine().executionEnabled).toBe(false);
  });

  it("change intelligence route is platform admin protected", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/change-intelligence")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/change-intelligence")).toBe(false);
  });

  it("UI has no execution controls", () => {
    const src = readRelative("components/platform-admin/RomaChangeIntelligenceClient.tsx");
    expect(src).not.toMatch(/>\s*Run\s/i);
    expect(src).not.toMatch(/>\s*Execute\s/i);
    expect(src).not.toMatch(/>\s*Deploy\s/i);
    expect(src).not.toMatch(/type="submit"/i);
  });
});
