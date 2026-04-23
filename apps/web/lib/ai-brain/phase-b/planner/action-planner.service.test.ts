/**
 * AI Brain Phase B — Action planner tests.
 */

import { describe, it, expect } from "vitest";
import { planActions } from "./action-planner.service";

const baseSnapshot = {
  tenantId: "tenant-1",
  projectId: "proj-1",
  at: new Date().toISOString(),
  projectStatus: "active",
  lastActivityAt: new Date().toISOString(),
  openTaskCounts: { total: 5, overdue: 2, completed: 1, inProgress: 2 },
  reportFreshness: "stale" as const,
  evidenceQualitySummary: "gaps" as const,
  topRisksSummary: { count: 3, highCount: 1 },
  missingEvidenceSummary: { count: 2 },
  intelligenceSummaryAvailability: true,
  milestoneSummary: { count: 2, available: true },
  approvalPressure: { pendingCount: 1, available: true },
  documentPressure: { underReviewCount: 1, available: true },
  budgetPressure: { available: false },
  dataSufficiencyFlags: {
    snapshot: "full" as const,
    health: "full" as const,
    risks: "full" as const,
    evidence: "full" as const,
    schedule: "full" as const,
    approvals: "full" as const,
    budget: "unavailable" as const,
  },
  snapshotWarnings: [],
};

describe("planActions", () => {
  it("returns empty drafts when snapshot has no pressure", () => {
    const snapshot = {
      ...baseSnapshot,
      openTaskCounts: { total: 0, overdue: 0, completed: 0, inProgress: 0 },
      topRisksSummary: { count: 0, highCount: 0 },
      missingEvidenceSummary: { count: 0 },
      approvalPressure: { pendingCount: 0, available: true },
      documentPressure: { underReviewCount: 0, available: true },
      reportFreshness: "fresh" as const,
    };
    const result = planActions({
      snapshot,
      mode: "manager_assist",
      userRole: "manager",
    });
    expect(result.drafts.length).toBe(0);
  });

  it("proposes draft_followup_task when overdue tasks present in manager_assist", () => {
    const result = planActions({
      snapshot: baseSnapshot,
      mode: "manager_assist",
      userRole: "manager",
    });
    const followup = result.drafts.find((d) => d.actionType === "draft_followup_task");
    expect(followup).toBeDefined();
    expect(followup!.title).toContain("overdue");
    expect(followup!.payload.overdueCount).toBe(2);
  });

  it("proposes draft_request_more_evidence when evidence gaps in manager_assist", () => {
    const result = planActions({
      snapshot: baseSnapshot,
      mode: "manager_assist",
      userRole: "manager",
    });
    const evidence = result.drafts.find((d) => d.actionType === "draft_request_more_evidence");
    expect(evidence).toBeDefined();
  });

  it("proposes draft_approval_followup when pending approvals", () => {
    const result = planActions({
      snapshot: baseSnapshot,
      mode: "manager_assist",
      userRole: "manager",
    });
    const approval = result.drafts.find((d) => d.actionType === "draft_approval_followup");
    expect(approval).toBeDefined();
  });

  it("client role does not get draft_followup_task", () => {
    const result = planActions({
      snapshot: baseSnapshot,
      mode: "manager_assist",
      userRole: "client",
    });
    const followup = result.drafts.find((d) => d.actionType === "draft_followup_task");
    expect(followup).toBeUndefined();
  });

  it("worker_assist proposes report and evidence actions", () => {
    const result = planActions({
      snapshot: baseSnapshot,
      mode: "worker_assist",
      userRole: "worker",
    });
    expect(result.drafts.some((d) => d.actionType === "draft_request_more_evidence")).toBe(true);
    expect(result.drafts.some((d) => d.actionType === "draft_report_review_note")).toBe(true);
  });
});
