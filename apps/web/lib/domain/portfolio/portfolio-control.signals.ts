import type { HealthLevel } from "@/lib/domain/projects/project-status.types";
import type { PortfolioBlockerCategory, PortfolioControlState } from "./portfolio-control.types";

/** Manager dashboard drill-down for the dominant signal (same tenant, project-scoped). */
export function drilldownHrefForCategory(projectId: string, category: PortfolioBlockerCategory): string {
  const base = `/dashboard/projects/${projectId}`;
  switch (category) {
    case "budget":
      return `${base}?tab=costs`;
    case "punch_list":
      return `${base}?tab=defects`;
    case "schedule":
      return `${base}?tab=schedule`;
    case "approvals":
      return `${base}?tab=documents`;
    case "client_requests":
      return `${base}/client`;
    case "change_orders":
      return base;
    case "discussions":
      return `${base}/client/discussions`;
    case "handover_pipeline":
      return base;
    case "aftercare":
      return `${base}?tab=aftercare`;
    case "issues":
      return `${base}?tab=issues`;
    case "reports":
      return `/dashboard/approvals`;
    default:
      return base;
  }
}

export interface ClassifyPortfolioInput {
  derivedHealthLevel: HealthLevel;
  budgetOverBudget: boolean;
  blockingDefectsCount: number;
  handoverBlockerCount: number;
  overdueMilestonesCount: number;
  activeAftercareCount: number;
  pendingApprovalsCount: number;
  pendingClientRequestsCount: number;
}

/**
 * Deterministic portfolio state — grounded in operational signals, not ML.
 * critical > attention > healthy
 */
export function classifyPortfolioControlState(input: ClassifyPortfolioInput): PortfolioControlState {
  if (input.budgetOverBudget || input.blockingDefectsCount > 0) {
    return "critical";
  }
  if (input.derivedHealthLevel === "critical") {
    return "critical";
  }
  if (input.handoverBlockerCount >= 3 || input.overdueMilestonesCount >= 3) {
    return "critical";
  }

  if (
    input.derivedHealthLevel === "warning" ||
    input.handoverBlockerCount >= 1 ||
    input.overdueMilestonesCount >= 1 ||
    input.pendingApprovalsCount >= 1 ||
    input.pendingClientRequestsCount >= 1 ||
    input.activeAftercareCount >= 1
  ) {
    return "attention";
  }

  return "healthy";
}

export function pickTopBlockerCategory(input: {
  budgetOverBudget: boolean;
  budgetNearingLimit: boolean;
  blockingDefectsCount: number;
  overdueMilestonesCount: number;
  pendingApprovalsCount: number;
  pendingClientRequestsCount: number;
  openChangeOrdersCount: number;
  openDiscussionsCount: number;
  activeAftercareCount: number;
  openIssuesCount: number;
  pendingReportApprovalsCount: number;
  handoverBlockerCount: number;
}): PortfolioBlockerCategory {
  if (input.budgetOverBudget || input.budgetNearingLimit) return "budget";
  if (input.blockingDefectsCount > 0) return "punch_list";
  if (input.overdueMilestonesCount > 0) return "schedule";
  if (input.pendingApprovalsCount > 0) return "approvals";
  if (input.pendingClientRequestsCount > 0) return "client_requests";
  if (input.openChangeOrdersCount > 0) return "change_orders";
  if (input.openDiscussionsCount > 0) return "discussions";
  if (input.handoverBlockerCount > 0) return "handover_pipeline";
  if (input.activeAftercareCount > 0) return "aftercare";
  if (input.openIssuesCount > 0) return "issues";
  if (input.pendingReportApprovalsCount > 0) return "reports";
  return "none";
}

export function primaryReasonForRow(
  state: PortfolioControlState,
  category: PortfolioBlockerCategory,
  input: ClassifyPortfolioInput & {
    openChangeOrdersCount: number;
    openDiscussionsCount: number;
    budgetNearingLimit?: boolean;
  }
): string {
  if (state === "healthy") {
    return "No major operational pressures from current signals.";
  }
  switch (category) {
    case "budget":
      return input.budgetOverBudget
        ? "Budget: actual exceeds planned."
        : input.budgetNearingLimit
          ? "Budget pressure — spending close to limit or line overruns."
          : "Budget signals need review.";
    case "punch_list":
      return "Punch list items block handover until cleared.";
    case "schedule":
      return "Schedule: overdue milestones.";
    case "approvals":
      return "Documents awaiting approval.";
    case "client_requests":
      return "Client requests need a response.";
    case "change_orders":
      return "Open change orders in flight.";
    case "discussions":
      return "Open stakeholder discussions.";
    case "handover_pipeline":
      return "Handover readiness blocked — see project handover panel.";
    case "aftercare":
      return "Active aftercare / warranty requests.";
    case "issues":
      return "Open project issues.";
    case "reports":
      return "Field reports awaiting review.";
    default:
      if (state === "critical") return "Multiple risk signals — review project summary.";
      return "Some follow-up recommended.";
  }
}
