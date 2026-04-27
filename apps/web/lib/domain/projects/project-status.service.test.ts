import { describe, it, expect } from "vitest";
import { deriveProjectStatus } from "./project-status.service";

describe("deriveProjectStatus", () => {
  describe("priority: completed", () => {
    it("returns completed when all tasks done", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 0,
        tasksDone: 5,
        milestonesCount: 2,
        openIssuesCount: 1,
        pendingDecisionsCount: 1,
      });
      expect(r.projectStatus).toBe("completed");
      expect(r.statusReasons.some((s) => s.code === "all_tasks_done")).toBe(true);
    });

    it("returns completed when done >= total (edge)", () => {
      const r = deriveProjectStatus({
        tasksTotal: 3,
        tasksInProgress: 0,
        tasksDone: 3,
        milestonesCount: 1,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      expect(r.projectStatus).toBe("completed");
      expect(r.healthLevel).toBe("good");
    });
  });

  describe("priority: draft", () => {
    it("returns draft when no tasks and no milestones", () => {
      const r = deriveProjectStatus({
        tasksTotal: 0,
        tasksInProgress: 0,
        tasksDone: 0,
        milestonesCount: 0,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      expect(r.projectStatus).toBe("draft");
      expect(r.statusReasons.some((s) => s.code === "no_tasks_or_milestones")).toBe(true);
    });

    it("returns active when milestones exist but no tasks", () => {
      const r = deriveProjectStatus({
        tasksTotal: 0,
        tasksInProgress: 0,
        tasksDone: 0,
        milestonesCount: 2,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      expect(r.projectStatus).toBe("active");
    });
  });

  describe("priority: blocked", () => {
    it("returns blocked when pendingDecisions >= 2", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 2,
        tasksDone: 1,
        milestonesCount: 1,
        openIssuesCount: 2,
        pendingDecisionsCount: 2,
      });
      expect(r.projectStatus).toBe("blocked");
      expect(r.healthLevel).toBe("critical");
      expect(r.statusReasons.some((s) => s.code === "blocked_on_decisions")).toBe(true);
    });

    it("does not block when pendingDecisions === 1", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 2,
        tasksDone: 1,
        milestonesCount: 1,
        openIssuesCount: 2,
        pendingDecisionsCount: 1,
      });
      expect(r.projectStatus).not.toBe("blocked");
      expect(r.projectStatus).toBe("active");
      expect(r.healthLevel).toBe("warning");
    });
  });

  describe("priority: at_risk", () => {
    it("returns at_risk when openIssues >= 3", () => {
      const r = deriveProjectStatus({
        tasksTotal: 10,
        tasksInProgress: 3,
        tasksDone: 2,
        milestonesCount: 1,
        openIssuesCount: 3,
        pendingDecisionsCount: 0,
      });
      expect(r.projectStatus).toBe("at_risk");
      expect(r.healthLevel).toBe("critical");
      expect(r.statusReasons.some((s) => s.code === "open_issues_high")).toBe(true);
    });

    it("returns active when openIssues === 2", () => {
      const r = deriveProjectStatus({
        tasksTotal: 10,
        tasksInProgress: 3,
        tasksDone: 2,
        milestonesCount: 1,
        openIssuesCount: 2,
        pendingDecisionsCount: 0,
      });
      expect(r.projectStatus).toBe("active");
      expect(r.healthLevel).toBe("warning");
    });
  });

  describe("priority: active", () => {
    it("returns active for normal progress", () => {
      const r = deriveProjectStatus({
        tasksTotal: 10,
        tasksInProgress: 3,
        tasksDone: 4,
        milestonesCount: 2,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      expect(r.projectStatus).toBe("active");
      expect(r.healthLevel).toBe("good");
      expect(r.statusReasons.some((s) => s.code === "normal_progress")).toBe(true);
    });
  });

  describe("attentionItems", () => {
    it("adds open_issues and pending_decisions when present", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 1,
        tasksDone: 2,
        milestonesCount: 1,
        openIssuesCount: 2,
        pendingDecisionsCount: 1,
      });
      expect(r.attentionItems).toHaveLength(2);
      expect(r.attentionItems.some((a) => a.id === "open_issues")).toBe(true);
      expect(r.attentionItems.some((a) => a.id === "pending_decisions")).toBe(true);
    });

    it("adds overdue_milestones with warning severity when count is 1", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 1,
        tasksDone: 2,
        milestonesCount: 2,
        overdueMilestonesCount: 1,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      const overdue = r.attentionItems.find((a) => a.id === "overdue_milestones");
      expect(overdue).toBeDefined();
      expect(overdue?.severity).toBe("warning");
      expect(overdue?.count).toBe(1);
    });

    it("adds overdue_milestones with critical severity when count >= 2", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 1,
        tasksDone: 2,
        milestonesCount: 4,
        overdueMilestonesCount: 2,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      const overdue = r.attentionItems.find((a) => a.id === "overdue_milestones");
      expect(overdue?.severity).toBe("critical");
    });

    it("adds pending_report_approvals attention when submitted reports await review", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 1,
        tasksDone: 2,
        milestonesCount: 1,
        pendingReportApprovalsCount: 2,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
      });
      const ap = r.attentionItems.find((a) => a.id === "pending_report_approvals");
      expect(ap).toBeDefined();
      expect(ap?.count).toBe(2);
      expect(ap?.severity).toBe("warning");
    });

    it("adds budget attention when over budget with cost items", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 1,
        tasksDone: 2,
        milestonesCount: 1,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
        budgetItemCount: 2,
        budgetOverBudget: true,
      });
      expect(r.attentionItems.some((a) => a.id === "budget_over_project")).toBe(true);
      expect(r.healthLevel).toBe("critical");
      expect(r.statusReasons.some((s) => s.code === "budget_over_project")).toBe(true);
    });

    it("adds cost line overrun attention without project-level over budget", () => {
      const r = deriveProjectStatus({
        tasksTotal: 5,
        tasksInProgress: 1,
        tasksDone: 2,
        milestonesCount: 1,
        openIssuesCount: 0,
        pendingDecisionsCount: 0,
        budgetItemCount: 3,
        budgetOverBudget: false,
        costLineOverrunCount: 1,
      });
      const o = r.attentionItems.find((a) => a.id === "cost_line_overruns");
      expect(o?.count).toBe(1);
      expect(o?.severity).toBe("warning");
    });
  });
});
