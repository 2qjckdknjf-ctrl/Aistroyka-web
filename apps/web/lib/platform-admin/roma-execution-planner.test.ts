import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getTestCatalog } from "./roma-test-catalog";
import {
  createExecutionPlan,
  explainExecutionPlan,
  getExecutionPlannerMeta,
  groupTestsIntoPhases,
  identifyBlockedTests,
  estimatePlanRuntime,
} from "./roma-execution-planner";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();
const CATALOG_IDS = new Set(getTestCatalog().items.map((i) => i.testId));

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("ROMA Execution Planner V1", () => {
  it("planner has execution disabled", () => {
    expect(getExecutionPlannerMeta().executionEnabled).toBe(false);
  });

  it("reports API change creates backend/mobile/business flow plan", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/Sync/ReportSync.swift"],
      changedApis: ["api-reports", "api-upload-storage"],
      changedMobileApps: ["ios-worker"],
    });
    expect(plan.executionEnabled).toBe(false);
    expect(plan.requiredTestDomains).toEqual(
      expect.arrayContaining(["backend", "business_flow", "mobile_ios", "mobile_android"])
    );
    expect(plan.selectedTests.length).toBeGreaterThan(0);
    expect(plan.selectedTests.some((t) => t.testId === "backend-api-reports-crud")).toBe(true);
    expect(plan.executionPhases.some((p) => p.phaseId === 1 || p.phaseId === 4)).toBe(true);
  });

  it("auth middleware change creates security/backend/release plan and manual review", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/middleware.ts", "apps/web/lib/supabase/session.ts"],
      changedModules: ["auth"],
    });
    expect(plan.requiredTestDomains).toEqual(expect.arrayContaining(["security", "backend", "web", "release"]));
    expect(plan.manualReviewRequired).toBe(true);
    expect(plan.selectedTests.some((t) => t.domain === "security" || t.domain === "backend")).toBe(true);
  });

  it("AI change creates AI/backend/security plan", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
      changedApis: ["api-ai"],
    });
    expect(plan.requiredTestDomains).toEqual(expect.arrayContaining(["ai", "backend", "security"]));
    expect(plan.executionPhases.some((p) => p.phaseId === 5)).toBe(true);
  });

  it("docs-only change creates minimal plan", () => {
    const plan = createExecutionPlan({
      changedPaths: ["docs/launch/P4_PROJECT_SETUP_RUNBOOK.md"],
    });
    expect(plan.releaseImpact).toBe("none");
    expect(plan.selectedTests.length).toBe(0);
    expect(plan.executionPhases.length).toBe(0);
  });

  it("unknown path creates UNKNOWN/manual review plan", () => {
    const plan = createExecutionPlan({
      changedPaths: ["tools/experimental/unknown-module.ts"],
    });
    expect(plan.confidence).toBe("unknown");
    expect(plan.manualReviewRequired).toBe(true);
    expect(plan.selectedTests.length).toBe(0);
    expect(plan.nextSafeAction).toMatch(/manual triage|review/i);
  });

  it("disabled catalog tests are not executable", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts"],
      changedApis: ["api-reports"],
    });
    for (const test of plan.selectedTests) {
      expect(test.executable).toBe(false);
    }
  });

  it("blocked tests marked when credentials or devices required", () => {
    const plan = createExecutionPlan({
      changedPaths: ["ios/Shared/Sync/ReportSync.swift"],
      changedMobileApps: ["ios-worker"],
    });
    expect(plan.blockedTests.length).toBeGreaterThan(0);
    expect(
      plan.blockedTests.some(
        (b) => b.reason.includes("Missing") || b.reason.includes("disabled")
      )
    ).toBe(true);
    const iosBlocked = plan.blockedTests.find((b) => b.testId === "ios-worker-report-sync");
    expect(iosBlocked?.reason).toMatch(/Missing|disabled/i);
  });

  it("selected tests come from Test Catalog", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/lib/platform-admin/shell-nav.ts"],
      changedModules: ["platform-admin"],
    });
    for (const test of plan.selectedTests) {
      expect(CATALOG_IDS.has(test.testId)).toBe(true);
    }
  });

  it("phases are deterministic", () => {
    const input = {
      changedPaths: ["apps/web/app/api/v1/reports/route.ts"],
      changedApis: ["api-reports"],
    };
    const plan1 = createExecutionPlan(input);
    const plan2 = createExecutionPlan(input);
    expect(plan1.planId).toBe(plan2.planId);
    expect(plan1.executionPhases).toEqual(plan2.executionPhases);
    const grouped = groupTestsIntoPhases(plan1.selectedTests.map((t) => t.testId));
    expect(grouped).toEqual(plan1.executionPhases);
  });

  it("estimatePlanRuntime returns formatted duration", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/middleware.ts"],
      changedModules: ["auth"],
    });
    expect(plan.estimatedRuntime).toMatch(/\d+m|\d+h|Unknown/);
    expect(estimatePlanRuntime(plan)).toBe(plan.estimatedRuntime);
  });

  it("explainExecutionPlan includes plan metadata", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/middleware.ts"],
    });
    const text = explainExecutionPlan(plan);
    expect(text).toMatch(/Plan ID/);
    expect(text).toMatch(/execution enabled: false/i);
  });

  it("identifyBlockedTests matches plan blocked list", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts"],
      changedApis: ["api-reports"],
    });
    expect(identifyBlockedTests(plan.selectedTests)).toEqual(plan.blockedTests);
  });

  it("has no external calls or execution endpoints", () => {
    const src = readRelative("lib/platform-admin/roma-execution-planner.ts");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/process\.env/);
  });

  it("execution planner route is platform admin protected", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/execution-planner")).toBe(true);
    expect(isPlatformAdminPagePath("/admin/testing/execution-planner")).toBe(false);
  });

  it("UI has no execution controls", () => {
    const src = readRelative("components/platform-admin/RomaExecutionPlannerClient.tsx");
    expect(src).not.toMatch(/>\s*Run\s/i);
    expect(src).not.toMatch(/>\s*Execute\s/i);
    expect(src).not.toMatch(/>\s*Deploy\s/i);
    expect(src).not.toMatch(/type="submit"/i);
  });
});
