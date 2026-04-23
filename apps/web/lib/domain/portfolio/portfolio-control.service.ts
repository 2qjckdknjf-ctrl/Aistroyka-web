import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { listByTenant } from "@/lib/domain/projects/project.repository";
import { getProjectSummary, type ProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import { deriveProjectStatus } from "@/lib/domain/projects/project-status.service";
import { computeHandoverReadinessFromSummary } from "@/lib/domain/project-handover/handover-readiness";
import { countOpenByProject } from "@/lib/domain/aftercare/aftercare.repository";
import type { HandoverBlocker } from "@/lib/domain/project-handover/project-handover.types";
import type { PortfolioControlResult, PortfolioProjectControlRow } from "./portfolio-control.types";
import {
  classifyPortfolioControlState,
  pickTopBlockerCategory,
  primaryReasonForRow,
} from "./portfolio-control.signals";

export const PORTFOLIO_CONTROL_MAX_PROJECTS = 20;

function countForCode(blockers: HandoverBlocker[], code: string): number {
  const b = blockers.find((x) => x.code === code);
  return b?.count ?? 0;
}

/** Single-project portfolio control row — shared with portfolio list and review packs. */
export async function buildPortfolioProjectControlRow(
  supabase: SupabaseClient,
  tenantId: string,
  project: { id: string; name: string },
  opts?: { cachedSummary?: ProjectSummary }
): Promise<PortfolioProjectControlRow> {
  const summary = opts?.cachedSummary ?? (await getProjectSummary(supabase, project.id, tenantId));
  const derived = deriveProjectStatus({
    tasksTotal: summary.tasksTotal,
    tasksInProgress: summary.tasksInProgress,
    tasksDone: summary.tasksDone,
    milestonesCount: summary.milestonesCount,
    overdueMilestonesCount: summary.overdueMilestonesCount,
    pendingReportApprovalsCount: summary.pendingReportApprovalsCount,
    openIssuesCount: summary.openIssuesCount,
    pendingDecisionsCount: summary.pendingDecisionsCount,
    budgetOverBudget: summary.budgetOverBudget,
    budgetNearingLimit: summary.budgetNearingLimit,
    costLineOverrunCount: summary.costLineOverrunCount,
    budgetItemCount: summary.budgetItemCount,
  });

  const [handover, aftercareOpen] = await Promise.all([
    computeHandoverReadinessFromSummary(supabase, project.id, tenantId, summary),
    countOpenByProject(supabase, project.id, tenantId),
  ]);

  const blockers = handover.blockers;
  const blockingDefects = countForCode(blockers, "blocking_punch_defects");
  const openChangeOrdersCount = countForCode(blockers, "open_change_orders");
  const pendingClientRequestsCount = countForCode(blockers, "pending_client_requests");
  const openDiscussionsCount = countForCode(blockers, "open_discussions");

  const classifyIn = {
    derivedHealthLevel: derived.healthLevel,
    budgetOverBudget: summary.budgetOverBudget,
    blockingDefectsCount: blockingDefects,
    handoverBlockerCount: blockers.length,
    overdueMilestonesCount: summary.overdueMilestonesCount,
    activeAftercareCount: aftercareOpen,
    pendingApprovalsCount: summary.pendingDecisionsCount,
    pendingClientRequestsCount,
  };

  const portfolioState = classifyPortfolioControlState(classifyIn);

  const topCategory = pickTopBlockerCategory({
    budgetOverBudget: summary.budgetOverBudget,
    budgetNearingLimit: summary.budgetNearingLimit,
    blockingDefectsCount: blockingDefects,
    overdueMilestonesCount: summary.overdueMilestonesCount,
    pendingApprovalsCount: summary.pendingDecisionsCount,
    pendingClientRequestsCount,
    openChangeOrdersCount,
    openDiscussionsCount,
    activeAftercareCount: aftercareOpen,
    openIssuesCount: summary.openIssuesCount,
    pendingReportApprovalsCount: summary.pendingReportApprovalsCount,
    handoverBlockerCount: blockers.length,
  });

  const primaryReason = primaryReasonForRow(portfolioState, topCategory, {
    ...classifyIn,
    openChangeOrdersCount,
    openDiscussionsCount,
    budgetNearingLimit: summary.budgetNearingLimit,
  });

  const baseHref = `/dashboard/projects/${project.id}`;

  return {
    id: project.id,
    name: project.name,
    portfolioState,
    derivedHealthLevel: derived.healthLevel,
    projectStatus: derived.projectStatus,
    topBlockerCategory: topCategory,
    primaryReason,
    signals: {
      overdueMilestonesCount: summary.overdueMilestonesCount,
      pendingApprovalsCount: summary.pendingDecisionsCount,
      pendingClientRequestsCount,
      openChangeOrdersCount,
      openDiscussionsCount,
      blockingDefectsCount: blockingDefects,
      activeAftercareCount: aftercareOpen,
      handoverBlockerCount: blockers.length,
      handoverReady: handover.ready,
      budgetOverBudget: summary.budgetOverBudget,
      budgetNearingLimit: summary.budgetNearingLimit,
      openIssuesCount: summary.openIssuesCount,
      pendingReportApprovalsCount: summary.pendingReportApprovalsCount,
    },
    projectHref: baseHref,
  };
}

export async function buildPortfolioControl(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<PortfolioControlResult> {
  const tenantId = ctx.tenantId!;
  const projects = await listByTenant(supabase, tenantId);
  const limited = projects.slice(0, PORTFOLIO_CONTROL_MAX_PROJECTS);

  const rows: PortfolioProjectControlRow[] = [];

  for (const p of limited) {
    rows.push(await buildPortfolioProjectControlRow(supabase, tenantId, p));
  }

  const distribution = {
    healthy: rows.filter((r) => r.portfolioState === "healthy").length,
    attention: rows.filter((r) => r.portfolioState === "attention").length,
    critical: rows.filter((r) => r.portfolioState === "critical").length,
  };

  return {
    projects: rows.sort((a, b) => {
      const order = { critical: 0, attention: 1, healthy: 2 };
      const d = order[a.portfolioState] - order[b.portfolioState];
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    }),
    distribution,
    totalProjects: projects.length,
    limitedTo: limited.length,
  };
}
