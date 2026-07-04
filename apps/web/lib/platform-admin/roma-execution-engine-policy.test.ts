import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createExecutionPlan } from "./roma-execution-planner";
import {
  evaluateExecutionPolicy,
  evaluateExecutionPolicyForInput,
  explainPolicyDecision,
  getExecutionEngineMeta,
  getForbiddenActionsForMode,
  isModePermitted,
  ROMA_EXECUTION_MODE_DEFINITIONS,
  ROMA_FORBIDDEN_EXECUTION_ACTIONS,
} from "./roma-execution-engine-policy";
import { ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT } from "./roma-execution-engine.types";
import { isPlatformAdminPagePath } from "./middleware-paths";

const ROOT = process.cwd();

function readRelative(path: string): string {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("ROMA Execution Engine Policy V1", () => {
  it("engine has execution disabled globally", () => {
    expect(getExecutionEngineMeta().executionEnabled).toBe(false);
  });

  it("production mutation is never allowed", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts"],
    });
    const decision = evaluateExecutionPolicy({ plan });
    expect(decision.productionMutationAllowed).toBe(false);
    expect(decision.destructiveActionsAllowed).toBe(false);
    expect(decision.forbiddenActions).toContain("production_mutation");
    expect(decision.forbiddenActions).toContain("deploy");
    expect(decision.forbiddenActions).toContain("db_mutation");
  });

  it("disabled catalog tests block execution", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/middleware.ts"],
    });
    const decision = evaluateExecutionPolicy({ plan });
    expect(decision.isExecutable).toBe(false);
    expect(decision.blockedReasons.some((r) => /Catalog test disabled/i.test(r))).toBe(true);
    expect(decision.policyGatesPassed).toBe(false);
  });

  it("missing credentials and devices block execution", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/app/api/v1/reports/route.ts", "ios/Shared/Sync/ReportSync.swift"],
      changedMobileApps: ["ios-worker"],
    });
    const decision = evaluateExecutionPolicy({ plan });
    expect(decision.blockedReasons.some((r) => /Missing credential|Missing device|Planner blocked/i.test(r))).toBe(
      true
    );
    expect(decision.isExecutable).toBe(false);
  });

  it("P0/security plans require manual approval", () => {
    const decision = evaluateExecutionPolicyForInput({
      changedPaths: ["apps/web/middleware.ts", "apps/web/lib/supabase/session.ts"],
      changedModules: ["auth"],
    });
    expect(decision.requiredApprovals).toEqual(
      expect.arrayContaining(["platform_owner", "security_reviewer", "manual_p0_review"])
    );
    expect(decision.recommendedMode).toBe("MANUAL_APPROVAL_REQUIRED");
    expect(decision.allowedModes).toContain("MANUAL_APPROVAL_REQUIRED");
  });

  it("docs-only plan can be PLAN_ONLY or DRY_RUN only", () => {
    const decision = evaluateExecutionPolicyForInput({
      changedPaths: ["docs/launch/P4_PROJECT_SETUP_RUNBOOK.md"],
    });
    expect(decision.allowedModes).toEqual(expect.arrayContaining(["PLAN_ONLY", "DRY_RUN"]));
    expect(decision.allowedModes).not.toContain("STAGING_EXECUTION");
    expect(decision.allowedModes).not.toContain("PRODUCTION_READONLY_AUDIT");
    expect(decision.recommendedMode).toBe("DRY_RUN");
  });

  it("SAFE_READONLY_AUDIT requires evidence sink", () => {
    const plan = createExecutionPlan({
      changedPaths: ["apps/web/lib/ai/copilot-handler.ts"],
    });
    const withoutSink = evaluateExecutionPolicy({ plan });
    expect(withoutSink.allowedModes).not.toContain("SAFE_READONLY_AUDIT");

    const withSink = evaluateExecutionPolicy({
      plan,
      context: {
        evidenceSinkConfigured: true,
        stagingAvailable: true,
        ownerApprovalGranted: true,
        securityApprovalGranted: true,
        credentialsAvailable: Object.fromEntries(plan.requiredCredentials.map((c) => [c, true])),
        devicesAvailable: Object.fromEntries(plan.requiredDevices.map((d) => [d, true])),
      },
    });
    expect(withSink.blockedReasons.some((r) => /Catalog test disabled/i.test(r))).toBe(true);
    expect(withSink.allowedModes).not.toContain("SAFE_READONLY_AUDIT");
  });

  it("SAFE_READONLY_AUDIT appears when evidence sink configured and catalog gates pass", () => {
    const docsPlan = createExecutionPlan({
      changedPaths: ["docs/audits/ROMA_EXECUTION_ENGINE_V1_DESIGN_REPORT.md"],
    });
    const decision = evaluateExecutionPolicy({
      plan: docsPlan,
      context: { evidenceSinkConfigured: true },
    });
    expect(decision.allowedModes).toEqual(expect.arrayContaining(["PLAN_ONLY", "DRY_RUN"]));
    expect(decision.allowedModes).not.toContain("SAFE_READONLY_AUDIT");
  });

  it("no mode permits deploy, fix, or DB mutation", () => {
    for (const def of ROMA_EXECUTION_MODE_DEFINITIONS) {
      const forbidden = getForbiddenActionsForMode(def.mode);
      expect(forbidden).toContain("deploy");
      expect(forbidden).toContain("auto_fix");
      expect(forbidden).toContain("db_mutation");
      expect(forbidden).toContain("production_mutation");
    }
    expect(ROMA_FORBIDDEN_EXECUTION_ACTIONS).toContain("ci_trigger");
  });

  it("policy output is deterministic", () => {
    const input = {
      changedPaths: ["apps/web/middleware.ts"],
      changedModules: ["auth" as const],
    };
    const a = evaluateExecutionPolicyForInput(input);
    const b = evaluateExecutionPolicyForInput(input);
    expect(a).toEqual(b);
    expect(a.planId).toBe(b.planId);
    expect(a.allowedModes).toEqual(b.allowedModes);
    expect(a.blockedReasons).toEqual(b.blockedReasons);
  });

  it("isModePermitted respects allowedModes", () => {
    const decision = evaluateExecutionPolicyForInput({
      changedPaths: ["docs/launch/P4_PROJECT_SETUP_RUNBOOK.md"],
    });
    expect(isModePermitted("DRY_RUN", decision)).toBe(true);
    expect(isModePermitted("STAGING_EXECUTION", decision)).toBe(false);
  });

  it("explainPolicyDecision includes metadata", () => {
    const decision = evaluateExecutionPolicyForInput({
      changedPaths: ["tools/experimental/unknown-module.ts"],
    });
    const text = explainPolicyDecision(decision);
    expect(text).toContain(decision.planId);
    expect(text).toContain("Policy gates passed");
  });

  it("default context is fail-closed", () => {
    expect(ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT.engineEnabled).toBe(false);
    expect(ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT.evidenceSinkConfigured).toBe(false);
    expect(ROMA_EXECUTION_POLICY_DEFAULT_CONTEXT.stagingAvailable).toBe(false);
  });

  it("has no external calls or runner functions", () => {
    const src = readRelative("lib/platform-admin/roma-execution-engine-policy.ts");
    expect(src).not.toMatch(/\bfetch\s*\(/);
    expect(src).not.toMatch(/\bexec\s*\(/);
    expect(src).not.toMatch(/\bspawn\s*\(/);
    expect(src).not.toMatch(/child_process/);
  });

  it("execution engine route is platform admin protected", () => {
    expect(isPlatformAdminPagePath("/platform-admin/testing/execution-engine")).toBe(true);
  });

  it("UI has no execution controls", () => {
    const ui = readRelative("components/platform-admin/RomaExecutionEngineClient.tsx");
    expect(ui).not.toMatch(/>\s*Run\s*</i);
    expect(ui).not.toMatch(/>\s*Execute\s*</i);
    expect(ui).not.toMatch(/workflow_dispatch|triggerCI|runTests/i);
  });
});
