import { describe, expect, it } from "vitest";
import { PLAN_ENTITLEMENTS_DEFAULTS } from "./entitlements-config";
import type { PlanCode } from "@aistroyka/contracts";

describe("plan entitlements config", () => {
  it("defines defaults for all four plan codes", () => {
    const codes: PlanCode[] = ["client_personal", "team_contractor", "business_operations", "enterprise"];
    for (const code of codes) {
      const ent = PLAN_ENTITLEMENTS_DEFAULTS[code];
      expect(ent).toBeDefined();
      expect(ent.limits).toBeDefined();
      expect(ent.capabilities).toBeDefined();
      expect(ent.limits.maxUsers).toBeGreaterThan(0);
      expect(ent.limits.maxProjects).toBeGreaterThan(0);
      expect(ent.limits.maxStorageGb).toBeGreaterThan(0);
      expect(ent.limits.maxMonthlyAiRequests).toBeGreaterThan(0);
    }
  });

  it("client_personal has limits 2, 2, 10, 0, 100", () => {
    const ent = PLAN_ENTITLEMENTS_DEFAULTS.client_personal;
    expect(ent.limits.maxUsers).toBe(2);
    expect(ent.limits.maxProjects).toBe(2);
    expect(ent.limits.maxStorageGb).toBe(10);
    expect(ent.limits.maxActiveMobileWorkers).toBe(0);
    expect(ent.limits.maxMonthlyAiRequests).toBe(100);
  });

  it("client_personal has tasks false", () => {
    expect(PLAN_ENTITLEMENTS_DEFAULTS.client_personal.capabilities.tasks).toBe(false);
  });

  it("client_personal has projects, basicDashboard, summaryGeneration true", () => {
    const c = PLAN_ENTITLEMENTS_DEFAULTS.client_personal.capabilities;
    expect(c.projects).toBe(true);
    expect(c.basicDashboard).toBe(true);
    expect(c.summaryGeneration).toBe(true);
    expect(c.advancedApprovals).toBe(false);
    expect(c.sso).toBe(false);
  });

  it("team_contractor has limits 20, 15, 100, 20, 2000", () => {
    const ent = PLAN_ENTITLEMENTS_DEFAULTS.team_contractor;
    expect(ent.limits.maxUsers).toBe(20);
    expect(ent.limits.maxProjects).toBe(15);
    expect(ent.limits.maxStorageGb).toBe(100);
    expect(ent.limits.maxActiveMobileWorkers).toBe(20);
    expect(ent.limits.maxMonthlyAiRequests).toBe(2000);
  });

  it("team_contractor has tasks, dailyReports, managerAi true; portfolioAnalytics false", () => {
    const c = PLAN_ENTITLEMENTS_DEFAULTS.team_contractor.capabilities;
    expect(c.tasks).toBe(true);
    expect(c.dailyReports).toBe(true);
    expect(c.managerAi).toBe(true);
    expect(c.portfolioAnalytics).toBe(false);
  });

  it("business_operations has advancedApprovals, advancedDocuments, portfolioAnalytics true", () => {
    const c = PLAN_ENTITLEMENTS_DEFAULTS.business_operations.capabilities;
    expect(c.advancedApprovals).toBe(true);
    expect(c.advancedDocuments).toBe(true);
    expect(c.portfolioAnalytics).toBe(true);
    expect(c.sso).toBe(false);
  });

  it("enterprise has sso, auditLogs, whiteGlove, multipleWorkspaces true", () => {
    const c = PLAN_ENTITLEMENTS_DEFAULTS.enterprise.capabilities;
    expect(c.sso).toBe(true);
    expect(c.auditLogs).toBe(true);
    expect(c.whiteGlove).toBe(true);
    expect(c.multipleWorkspaces).toBe(true);
  });

  it("enterprise has sentinel limits (high numbers)", () => {
    const ent = PLAN_ENTITLEMENTS_DEFAULTS.enterprise;
    expect(ent.limits.maxUsers).toBeGreaterThanOrEqual(1000);
    expect(ent.limits.maxProjects).toBeGreaterThanOrEqual(100);
  });
});
