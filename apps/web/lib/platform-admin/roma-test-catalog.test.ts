import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getQualityGraph } from "./roma-quality-graph";
import {
  getCatalogSummary,
  getReleaseCriticalTests,
  getTestCatalog,
  getTestsByDomain,
  getTestsForAffectedAreas,
  getTestsForGraphNodes,
  getTestsForPlatforms,
  getTestsForRoles,
  ROMA_TEST_CATALOG_DOMAINS,
} from "./roma-test-catalog";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("ROMA Test Catalog V1", () => {
  it("loads catalog with execution disabled", () => {
    const catalog = getTestCatalog();
    expect(catalog.version).toBe("v1");
    expect(catalog.executionEnabled).toBe(false);
    expect(catalog.items.length).toBeGreaterThan(0);
  });

  it("has unique test IDs", () => {
    const ids = getTestCatalog().items.map((i) => i.testId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has all entries disabled by default", () => {
    for (const item of getTestCatalog().items) {
      expect(item.enabled).toBe(false);
    }
    expect(getCatalogSummary().enabledCount).toBe(0);
  });

  it("covers all required domains", () => {
    for (const domain of ROMA_TEST_CATALOG_DOMAINS) {
      expect(getTestsByDomain(domain).length, domain).toBeGreaterThan(0);
    }
  });

  it("includes release-critical entries", () => {
    const critical = getReleaseCriticalTests();
    expect(critical.length).toBeGreaterThan(10);
    expect(critical.some((t) => t.testId === "backend-api-health")).toBe(true);
    expect(critical.some((t) => t.testId === "sec-rbac-platform-owner-grant")).toBe(true);
    expect(critical.some((t) => t.testId === "release-staging-buildstamp")).toBe(true);
  });

  it("references valid quality graph nodes", () => {
    const graphNodeIds = new Set(getQualityGraph().nodes.map((n) => n.id));
    for (const item of getTestCatalog().items) {
      for (const nodeId of item.relatedGraphNodes) {
        expect(graphNodeIds.has(nodeId), `${item.testId} → ${nodeId}`).toBe(true);
      }
    }
  });

  it("filters by platform", () => {
    const iosTests = getTestsForPlatforms(["ios"]);
    expect(iosTests.length).toBeGreaterThan(0);
    expect(iosTests.every((t) => t.supportedPlatforms.includes("ios"))).toBe(true);

    const webOnly = getTestsForPlatforms(["web"]);
    expect(webOnly.some((t) => t.testId === "web-routing-locale-default")).toBe(true);
  });

  it("filters by role", () => {
    const ownerTests = getTestsForRoles(["platform_owner"]);
    expect(ownerTests.length).toBeGreaterThan(0);
    expect(ownerTests.some((t) => t.testId === "sec-owner-access-cloudflare")).toBe(true);

    const workerTests = getTestsForRoles(["worker"]);
    expect(workerTests.some((t) => t.testId === "ios-worker-report-sync")).toBe(true);
  });

  it("maps tests for affected product areas", () => {
    const tests = getTestsForAffectedAreas(["pa-worker-reports"]);
    expect(tests.some((t) => t.testId === "bf-reports-worker-submit")).toBe(true);
    expect(tests.some((t) => t.testId === "ios-worker-report-sync")).toBe(true);
  });

  it("links graph nodes to catalog tests", () => {
    const tests = getTestsForGraphNodes(["pa-platform-admin", "td-security-rbac"]);
    expect(tests.some((t) => t.testId === "sec-rbac-platform-owner-grant")).toBe(true);
  });

  it("catalog integrity: required fields present", () => {
    for (const item of getTestCatalog().items) {
      expect(item.testId).toBeTruthy();
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.supportedPlatforms.length).toBeGreaterThan(0);
      expect(item.supportedRoles.length).toBeGreaterThan(0);
      expect(item.relatedGraphNodes.length).toBeGreaterThan(0);
      expect(item.estimatedRuntime).toBeTruthy();
    }
  });

  it("has no external calls in catalog module", () => {
    const src = readRelative("lib/platform-admin/roma-test-catalog.ts");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/process\.env/);
  });

  it("test catalog route is platform admin protected", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/test-catalog")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/test-catalog")).toBe(false);
  });

  it("UI has no execution controls", () => {
    const src = readRelative("components/platform-admin/RomaTestCatalogClient.tsx");
    expect(src).not.toMatch(/>\s*Run\s/i);
    expect(src).not.toMatch(/>\s*Execute\s/i);
    expect(src).not.toMatch(/>\s*Deploy\s/i);
    expect(src).not.toMatch(/>\s*Fix\s/i);
  });
});
