import { describe, expect, it } from "vitest";
import { recommendPlan } from "./recommend";

describe("recommendPlan", () => {
  it("recommends client_personal for private client: 1 user, 1 project, no mobile", () => {
    const out = recommendPlan({
      personaType: "client",
      expectedUsersRange: "1",
      expectedProjectsRange: "1",
      priorities: ["owner_visibility", "reports_photo"],
      needsMobileWorkforce: false,
      needsFormalProcesses: false,
      startMode: "self_serve",
    });
    expect(out.recommendedPlanCode).toBe("client_personal");
    expect(out.alternativePlanCodes).toContain("team_contractor");
    expect(out.enterpriseSignal).toBe(false);
    expect(out.reasoningCodes.length).toBeGreaterThan(0);
  });

  it("recommends team_contractor for contractor 6–20 users + mobile workforce", () => {
    const out = recommendPlan({
      personaType: "contractor",
      expectedUsersRange: "6_20",
      expectedProjectsRange: "2_5",
      priorities: ["execution_control", "reports_photo"],
      needsMobileWorkforce: true,
      needsFormalProcesses: false,
      startMode: "self_serve",
    });
    expect(out.recommendedPlanCode).toBe("team_contractor");
    expect(out.alternativePlanCodes).toContain("business_operations");
    expect(out.enterpriseSignal).toBe(false);
  });

  it("recommends business_operations for supervisor with approvals + docs + analytics", () => {
    const out = recommendPlan({
      personaType: "supervisor",
      expectedUsersRange: "6_20",
      expectedProjectsRange: "6_20",
      priorities: ["approvals_documents", "quality_defects", "ai_insights"],
      needsMobileWorkforce: false,
      needsFormalProcesses: true,
      startMode: "self_serve",
    });
    expect(out.recommendedPlanCode).toBe("business_operations");
    expect(out.alternativePlanCodes).toContain("enterprise");
    expect(out.enterpriseSignal).toBe(false);
  });

  it("recommends business_operations for developer_owner with multi-project", () => {
    const out = recommendPlan({
      personaType: "developer_owner",
      expectedUsersRange: "6_20",
      expectedProjectsRange: "20_plus",
      priorities: ["approvals_documents", "owner_visibility"],
      needsMobileWorkforce: false,
      needsFormalProcesses: true,
      startMode: "guided_setup",
    });
    expect(out.recommendedPlanCode).toBe("business_operations");
  });

  it("recommends enterprise for high-scale + demo startMode", () => {
    const out = recommendPlan({
      personaType: "developer_owner",
      expectedUsersRange: "21_100",
      expectedProjectsRange: "20_plus",
      priorities: ["approvals_documents", "quality_defects"],
      needsMobileWorkforce: false,
      needsFormalProcesses: true,
      startMode: "demo",
    });
    expect(out.recommendedPlanCode).toBe("enterprise");
    expect(out.enterpriseSignal).toBe(true);
    expect(out.alternativePlanCodes).not.toContain("enterprise");
  });

  it("recommends enterprise for 100_plus users", () => {
    const out = recommendPlan({
      personaType: "supervisor",
      expectedUsersRange: "100_plus",
      expectedProjectsRange: "20_plus",
      priorities: [],
      needsMobileWorkforce: false,
      needsFormalProcesses: true,
      startMode: "self_serve",
    });
    expect(out.recommendedPlanCode).toBe("enterprise");
    expect(out.enterpriseSignal).toBe(true);
  });

  it("always returns alternativePlanCodes (no hard lock)", () => {
    const out = recommendPlan({
      personaType: "client",
      expectedUsersRange: "1",
      expectedProjectsRange: "1",
      priorities: [],
      needsMobileWorkforce: false,
      needsFormalProcesses: false,
      startMode: "self_serve",
    });
    expect(out.alternativePlanCodes.length).toBe(3);
    expect(out.reasoningCodes.length).toBeGreaterThan(0);
  });
});
