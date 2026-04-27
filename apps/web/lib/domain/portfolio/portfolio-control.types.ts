import type { HealthLevel } from "@/lib/domain/projects/project-status.types";

/** Wave 4 Step 15 — explainable portfolio control (not BI). */
export type PortfolioControlState = "healthy" | "attention" | "critical";

/** Dominant pressure type for sorting and labels. */
export type PortfolioBlockerCategory =
  | "punch_list"
  | "schedule"
  | "approvals"
  | "budget"
  | "handover_pipeline"
  | "client_requests"
  | "change_orders"
  | "discussions"
  | "aftercare"
  | "issues"
  | "reports"
  | "none";

export interface PortfolioControlSignalCounts {
  overdueMilestonesCount: number;
  pendingApprovalsCount: number;
  pendingClientRequestsCount: number;
  openChangeOrdersCount: number;
  openDiscussionsCount: number;
  blockingDefectsCount: number;
  activeAftercareCount: number;
  handoverBlockerCount: number;
  handoverReady: boolean;
  budgetOverBudget: boolean;
  budgetNearingLimit: boolean;
  openIssuesCount: number;
  pendingReportApprovalsCount: number;
}

export interface PortfolioProjectControlRow {
  id: string;
  name: string;
  portfolioState: PortfolioControlState;
  /** Derived from existing project status health (good/warning/critical). */
  derivedHealthLevel: HealthLevel;
  /** Presentation status from project-status.service (draft/active/...). */
  projectStatus: string;
  topBlockerCategory: PortfolioBlockerCategory;
  /** Short human-readable explanation for the row. */
  primaryReason: string;
  signals: PortfolioControlSignalCounts;
  /** Drill-down to manager project dashboard. */
  projectHref: string;
}

export interface PortfolioControlResult {
  projects: PortfolioProjectControlRow[];
  distribution: {
    healthy: number;
    attention: number;
    critical: number;
  };
  totalProjects: number;
  limitedTo: number;
}
