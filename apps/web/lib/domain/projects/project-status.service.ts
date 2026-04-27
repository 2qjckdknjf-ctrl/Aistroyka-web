/**
 * Derived project status and health — MVP
 *
 * Deterministic, explainable logic. Uses only existing summary counts.
 * See docs/project-status-health-mvp.md.
 */

import type {
  ProjectStatusInput,
  DerivedProjectStatus,
  StatusReason,
  AttentionItem,
  ProjectStatus,
  HealthLevel,
} from "./project-status.types";

/** Human-readable label for ProjectStatus. */
export function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "active":
      return "In progress";
    case "at_risk":
      return "Needs attention";
    case "blocked":
      return "Blocked";
    case "completed":
      return "Completed";
    default:
      return "—";
  }
}

/** Tailwind-like class for status badge. */
export function statusBadgeClass(status: ProjectStatus): string {
  switch (status) {
    case "draft":
      return "bg-aistroyka-text-tertiary/20 text-aistroyka-text-tertiary";
    case "active":
      return "bg-aistroyka-info/20 text-aistroyka-info";
    case "at_risk":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "blocked":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    case "completed":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    default:
      return "";
  }
}

/** Human-readable label for HealthLevel. */
export function healthLabel(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "Good";
    case "warning":
      return "Attention needed";
    case "critical":
      return "Critical";
    default:
      return "—";
  }
}

/** Tailwind-like class for health badge. */
export function healthBadgeClass(level: HealthLevel): string {
  switch (level) {
    case "good":
      return "bg-aistroyka-success/20 text-aistroyka-success";
    case "warning":
      return "bg-aistroyka-warning/20 text-aistroyka-warning";
    case "critical":
      return "bg-aistroyka-error/20 text-aistroyka-error";
    default:
      return "";
  }
}

/**
 * Derives project status and health from summary counts.
 *
 * Priority order: completed > draft > blocked > at_risk > active
 */
export function deriveProjectStatus(input: ProjectStatusInput): DerivedProjectStatus {
  const reasons: StatusReason[] = [];
  const attention: AttentionItem[] = [];

  const total = input.tasksTotal ?? 0;
  const done = input.tasksDone ?? 0;
  const milestones = input.milestonesCount ?? 0;
  const overdueMilestones = input.overdueMilestonesCount ?? 0;
  const pendingReportApprovals = input.pendingReportApprovalsCount ?? 0;
  const openIssues = input.openIssuesCount ?? 0;
  const pendingDecisions = input.pendingDecisionsCount ?? 0;
  const budgetOverBudget = input.budgetOverBudget ?? false;
  const budgetNearingLimit = input.budgetNearingLimit ?? false;
  const costLineOverrunCount = input.costLineOverrunCount ?? 0;
  const budgetItemCount = input.budgetItemCount ?? 0;
  const commercialOverdueCount = input.commercialOverdueCount ?? 0;

  // Build attention items from signals
  if (pendingReportApprovals > 0) {
    attention.push({
      id: "pending_report_approvals",
      label: "Reports awaiting approval",
      severity: pendingReportApprovals >= 5 ? "critical" : "warning",
      count: pendingReportApprovals,
    });
  }
  if (overdueMilestones > 0) {
    attention.push({
      id: "overdue_milestones",
      label: "Overdue milestones",
      severity: overdueMilestones >= 2 ? "critical" : "warning",
      count: overdueMilestones,
    });
  }
  if (openIssues > 0) {
    attention.push({
      id: "open_issues",
      label: "Open issues",
      severity: openIssues >= 3 ? "critical" : openIssues >= 1 ? "warning" : "info",
      count: openIssues,
    });
  }
  if (pendingDecisions > 0) {
    attention.push({
      id: "pending_decisions",
      label: "Documents awaiting decision",
      severity: pendingDecisions >= 2 ? "critical" : "warning",
      count: pendingDecisions,
    });
  }
  if (commercialOverdueCount > 0) {
    attention.push({
      id: "commercial_overdue",
      label: "Commercial / billing items overdue or unpaid past due date",
      severity: commercialOverdueCount >= 2 ? "critical" : "warning",
      count: commercialOverdueCount,
    });
  }
  if (budgetItemCount > 0) {
    if (budgetOverBudget) {
      attention.push({
        id: "budget_over_project",
        label: "Project is over budget (actual exceeds planned total)",
        severity: "critical",
      });
    } else if (budgetNearingLimit) {
      attention.push({
        id: "budget_near_limit",
        label: "Project budget: most of planned amount is used",
        severity: "warning",
      });
    }
    if (costLineOverrunCount > 0) {
      attention.push({
        id: "cost_line_overruns",
        label: "Cost line(s) with actual above planned",
        severity: budgetOverBudget ? "critical" : "warning",
        count: costLineOverrunCount,
      });
    }
  }

  // 1. Completed: all tasks done
  if (total > 0 && done >= total) {
    reasons.push({
      code: "all_tasks_done",
      label: "All tasks completed",
      hint: `${done}/${total} tasks done`,
    });
    if (budgetOverBudget) {
      reasons.push({
        code: "budget_over_project",
        label: "Budget: actual exceeds planned",
        hint: "Review cost items on the Costs tab",
      });
    }
    return {
      projectStatus: "completed",
      healthLevel: budgetOverBudget
        ? "critical"
        : pendingDecisions > 0 || openIssues > 0
          ? "warning"
          : "good",
      statusReasons: reasons,
      attentionItems: attention,
    };
  }

  // 2. Draft: no work defined yet
  if (total === 0 && milestones === 0) {
    reasons.push({
      code: "no_tasks_or_milestones",
      label: "No tasks or milestones yet",
      hint: "Project setup in progress",
    });
    return {
      projectStatus: "draft",
      healthLevel: "good",
      statusReasons: reasons,
      attentionItems: attention,
    };
  }

  // 3. Blocked: multiple documents awaiting decision
  if (pendingDecisions >= 2) {
    reasons.push({
      code: "blocked_on_decisions",
      label: "Multiple documents awaiting approval",
      hint: `${pendingDecisions} documents under review`,
    });
    return {
      projectStatus: "blocked",
      healthLevel: "critical",
      statusReasons: reasons,
      attentionItems: attention,
    };
  }

  // 4. At risk: many open issues
  if (openIssues >= 3) {
    reasons.push({
      code: "open_issues_high",
      label: "Several open issues need attention",
      hint: `${openIssues} open or in-review issues`,
    });
    return {
      projectStatus: "at_risk",
      healthLevel: "critical",
      statusReasons: reasons,
      attentionItems: attention,
    };
  }

  // 5. Active: normal progress
  reasons.push({
    code: "normal_progress",
    label: "Project in progress",
    hint: total > 0 ? `${done}/${total} tasks done` : "No tasks yet",
  });
  if (budgetOverBudget) {
    reasons.push({
      code: "budget_over_project",
      label: "Budget: actual exceeds planned",
      hint: "Review cost items on the Costs tab",
    });
  } else if (
    budgetItemCount > 0 &&
    (budgetNearingLimit || costLineOverrunCount > 0)
  ) {
    reasons.push({
      code: "budget_pressure",
      label: "Budget pressure on cost lines",
      hint:
        costLineOverrunCount > 0
          ? `${costLineOverrunCount} line(s) over planned`
          : "Spending is close to planned total",
    });
  }
  const healthLevel: HealthLevel = budgetOverBudget
    ? "critical"
    : openIssues >= 1 ||
        pendingDecisions >= 1 ||
        budgetNearingLimit ||
        costLineOverrunCount > 0 ||
        commercialOverdueCount > 0
      ? "warning"
      : "good";
  return {
    projectStatus: "active",
    healthLevel,
    statusReasons: reasons,
    attentionItems: attention,
  };
}
