/**
 * AI Brain Phase B — Policy evaluator tests.
 */

import { describe, it, expect } from "vitest";
import { evaluateActionPolicy } from "./action-policy.evaluator";

const baseSnapshot = {
  tenantId: "t1",
  projectId: "p1",
  at: new Date().toISOString(),
  projectStatus: "active",
  lastActivityAt: null,
  openTaskCounts: { total: 5, overdue: 0, completed: 0, inProgress: 0 },
  reportFreshness: "fresh",
  evidenceQualitySummary: "sufficient",
  topRisksSummary: { count: 0, highCount: 0 },
  missingEvidenceSummary: { count: 0 },
  intelligenceSummaryAvailability: true,
  milestoneSummary: { count: 2, available: true },
  approvalPressure: { pendingCount: 1, available: true },
  documentPressure: { underReviewCount: 1, available: true },
  budgetPressure: { available: false },
  dataSufficiencyFlags: {
    snapshot: "full",
    health: "full",
    risks: "full",
    evidence: "full",
    schedule: "full",
    approvals: "full",
    budget: "unavailable",
  },
  snapshotWarnings: [],
};

describe("evaluateActionPolicy", () => {
  it("allows read_only for explain_state", () => {
    const r = evaluateActionPolicy({
      actionType: "explain_state",
      userRole: "manager",
      tenantId: "t1",
      projectId: "p1",
      mode: "manager_assist",
      snapshot: baseSnapshot,
    });
    expect(r.policy).toBe("allowed_as_read_only");
    expect(r.requiresApproval).toBe(false);
  });

  it("forbids draft_followup_task for client role", () => {
    const r = evaluateActionPolicy({
      actionType: "draft_followup_task",
      userRole: "client",
      tenantId: "t1",
      projectId: "p1",
      mode: "client_safe_summary",
      snapshot: baseSnapshot,
    });
    expect(r.policy).toBe("forbidden");
  });

  it("allows draft_followup_task for manager", () => {
    const r = evaluateActionPolicy({
      actionType: "draft_followup_task",
      userRole: "manager",
      tenantId: "t1",
      projectId: "p1",
      mode: "manager_assist",
      snapshot: baseSnapshot,
    });
    expect(r.policy).toBe("allowed_as_draft_only");
  });

  it("requires approval for create_internal_task_draft", () => {
    const r = evaluateActionPolicy({
      actionType: "create_internal_task_draft",
      userRole: "manager",
      tenantId: "t1",
      projectId: "p1",
      mode: "manager_assist",
      snapshot: baseSnapshot,
    });
    expect(r.policy).toBe("requires_manual_approval");
    expect(r.requiresApproval).toBe(true);
  });
});
