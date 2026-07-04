import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  analyzeChangeImpact,
  getAffectedAreasForChange,
  getEdgesForNode,
  getGraphSummary,
  getNodesByType,
  getQualityGraph,
  getRequiredNodeTypes,
  getRequiredTestDomainsForAffectedAreas,
  getReleaseGateImpact,
  getRisksForAffectedAreas,
} from "./roma-quality-graph";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("ROMA Quality Graph V1", () => {
  it("loads deterministic read-only graph", () => {
    const graph = getQualityGraph();
    expect(graph.version).toBe("v1");
    expect(graph.executionEnabled).toBe(false);
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.generatedAt).toBeTruthy();
  });

  it("has required node types represented", () => {
    const types = getRequiredNodeTypes();
    for (const type of types) {
      expect(getNodesByType(type).length, type).toBeGreaterThan(0);
    }
  });

  it("includes critical product areas", () => {
    const areas = getNodesByType("product_area");
    const labels = areas.map((a) => a.label);
    expect(labels).toContain("Platform Admin");
    expect(labels).toContain("Worker reports");
    expect(labels).toContain("AI Copilot");
    expect(labels).toContain("Tenant isolation");
    expect(labels).toContain("Release pipeline");
  });

  it("maps worker reports to storage, mobile, and report risks", () => {
    const risks = getRisksForAffectedAreas(["pa-worker-reports"]);
    expect(risks).toContain("risk-worker-upload-broken");
    expect(risks).toContain("risk-storage-unavailable");
    expect(risks).toContain("risk-mobile-parity-broken");

    const tests = getRequiredTestDomainsForAffectedAreas(["pa-worker-reports"]);
    expect(tests).toContain("td-mobile-ios");
    expect(tests).toContain("td-mobile-android");
    expect(tests).toContain("td-backend-api");

    const flowEdges = getEdgesForNode("bf-worker-submit-report");
    expect(flowEdges.some((e) => e.targetId === "api-upload-storage")).toBe(true);
    expect(flowEdges.some((e) => e.targetId === "api-reports")).toBe(true);
  });

  it("maps AI Copilot to AI safety and security risks", () => {
    const risks = getRisksForAffectedAreas(["pa-ai-copilot"]);
    expect(risks).toContain("risk-ai-leakage");

    const tests = getRequiredTestDomainsForAffectedAreas(["pa-ai-copilot"]);
    expect(tests).toContain("td-ai-safety");
    expect(tests).toContain("td-security-rbac");

    const mitigates = getQualityGraph().edges.filter(
      (e) => e.type === "mitigates" && e.targetId === "risk-ai-leakage"
    );
    expect(mitigates.some((e) => e.sourceId === "td-ai-safety")).toBe(true);
  });

  it("maps platform admin to security, RBAC, and release risks", () => {
    const risks = getRisksForAffectedAreas(["pa-platform-admin"]);
    expect(risks).toContain("risk-platform-admin-exposure");
    expect(risks).toContain("risk-tenant-leakage");

    const tests = getRequiredTestDomainsForAffectedAreas(["pa-platform-admin"]);
    expect(tests).toContain("td-security-rbac");
    expect(tests).toContain("td-release-smoke");

    const gates = getReleaseGateImpact(["pa-platform-admin"]);
    expect(gates.gateIds).toContain("rg-platform-admin-access");
  });

  it("returns expected affected areas for changed paths", () => {
    const platformAreas = getAffectedAreasForChange({
      changedPaths: ["apps/web/lib/platform-admin/shell-nav.ts"],
      changedModules: ["platform-admin"],
    });
    expect(platformAreas).toContain("pa-platform-admin");
    expect(platformAreas).toContain("pa-roma-qa-center");

    const reportAreas = getAffectedAreasForChange({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/ReportSync.swift"],
      changedApis: ["api-reports"],
    });
    expect(reportAreas).toContain("pa-worker-reports");
  });

  it("derives required test domains from affected areas", () => {
    const areas = getAffectedAreasForChange({
      changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
      changedApis: ["api-ai"],
    });
    const domains = getRequiredTestDomainsForAffectedAreas(areas);
    expect(domains).toContain("td-ai-safety");
  });

  it("analyzes change impact with release confidence", () => {
    const impact = analyzeChangeImpact({
      changedPaths: ["apps/web/middleware.ts", "apps/web/lib/platform-owner/require-platform-owner-page.ts"],
      changedModules: ["platform-admin"],
    });
    expect(impact.productAreaIds.length).toBeGreaterThan(0);
    expect(impact.summary).toMatch(/Release confidence impact/i);
    expect(["none", "low", "medium", "high"]).toContain(impact.releaseConfidenceImpact);
  });

  it("has no external calls or secrets in graph module", () => {
    const src = readRelative("lib/platform-admin/roma-quality-graph.ts");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/readFileSync|fs\./);
    expect(src).not.toMatch(/process\.env/);
    expect(src).not.toMatch(/API_KEY\s*=|SECRET\s*=|PASSWORD\s*=/);
  });

  it("quality graph route is platform admin protected", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/quality-graph")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/quality-graph")).toBe(false);
  });

  it("UI has no execution buttons", () => {
    const paths = [
      "components/platform-admin/RomaQualityGraphClient.tsx",
      "app/[locale]/(platform-admin)/platform-admin/testing/quality-graph/page.tsx",
    ];
    const forbidden = [/<button/i, />\s*Run\s/i, />\s*Execute\s/i, />\s*Deploy\s/i, />\s*Fix\s/i];
    for (const path of paths) {
      const src = readRelative(path);
      for (const pattern of forbidden) {
        expect(src, path).not.toMatch(pattern);
      }
    }
  });

  it("graph summary counts match node inventory", () => {
    const summary = getGraphSummary();
    const graph = getQualityGraph();
    expect(summary.nodeCount).toBe(graph.nodes.length);
    expect(summary.edgeCount).toBe(graph.edges.length);
    expect(summary.criticalProductAreas.length).toBeGreaterThan(0);
    expect(summary.highRisks.length).toBeGreaterThan(0);
  });
});
