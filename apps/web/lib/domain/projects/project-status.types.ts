/**
 * Project status / health presentation — MVP
 *
 * Derived presentation layer. Not a lifecycle engine.
 * See docs/project-status-health-mvp.md for rules and limits.
 */

/** Minimal presentation status set for MVP. */
export type ProjectStatus =
  | "draft"
  | "active"
  | "at_risk"
  | "blocked"
  | "completed";

/** Health level for quick glance. */
export type HealthLevel = "good" | "warning" | "critical";

/** Reason code for status. */
export type StatusReasonCode =
  | "no_tasks_or_milestones"
  | "all_tasks_done"
  | "open_issues_high"
  | "pending_decisions_high"
  | "normal_progress"
  | "blocked_on_decisions"
  | "budget_over_project"
  | "budget_pressure";

/** Human-readable reason entry. */
export interface StatusReason {
  code: StatusReasonCode;
  label: string;
  /** Optional short explanation for UI. */
  hint?: string;
}

/** Attention item for "needs attention" block. */
export interface AttentionItem {
  id: string;
  label: string;
  /** critical | warning | info */
  severity: "critical" | "warning" | "info";
  count?: number;
}

/** Input shape for derivation (matches ProjectSummary). */
export interface ProjectStatusInput {
  tasksTotal: number;
  tasksInProgress: number;
  tasksDone: number;
  milestonesCount: number;
  /** Active milestones past target date (planned / in_progress / delayed). */
  overdueMilestonesCount?: number;
  /** Submitted worker reports awaiting manager review (project-scoped). */
  pendingReportApprovalsCount?: number;
  openIssuesCount: number;
  pendingDecisionsCount: number;
  /** Cost layer: sum of actual > planned total (non-archived lines). */
  budgetOverBudget?: boolean;
  /** Cost layer: ≥90% of planned total spent, not yet over. */
  budgetNearingLimit?: boolean;
  /** Cost lines where actual > planned on that line. */
  costLineOverrunCount?: number;
  /** Has at least one cost line (for gating signals). */
  budgetItemCount?: number;
  /** Wave 4 Step 21 — billing lines past due or unpaid on schedule. */
  commercialOverdueCount?: number;
}

/** Output of derived status layer. */
export interface DerivedProjectStatus {
  projectStatus: ProjectStatus;
  healthLevel: HealthLevel;
  statusReasons: StatusReason[];
  attentionItems: AttentionItem[];
}
