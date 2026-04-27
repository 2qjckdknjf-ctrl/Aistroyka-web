/**
 * Wave 4 Step 18 — project-level executive review pack (curated read model).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildPortfolioProjectControlRow } from "@/lib/domain/portfolio/portfolio-control.service";
import { getProjectSummary } from "@/lib/domain/projects/project-summary.repository";
import { computeHandoverReadinessFromSummary } from "@/lib/domain/project-handover/handover-readiness";
import { getProjectAttentionSummary } from "@/lib/domain/projects/project-attention.repository";
import { getStakeholderActivityTimeline } from "@/lib/domain/projects/stakeholder-activity-timeline.repository";
import { healthLabel, statusLabel } from "@/lib/domain/projects/project-status.service";
import type { ProjectStatus } from "@/lib/domain/projects/project-status.types";
import type { ProjectReviewPack, ReviewPackBlockerLine } from "./review-packs.types";
import type { ProjectSummary } from "@/lib/domain/projects/project-summary.repository";

function budgetNarrative(s: {
  overBudget: boolean;
  nearingLimit: boolean;
  planned: number;
  actual: number;
  currency: string;
}): string {
  if (s.overBudget) {
    return `Actual costs exceed planned total (${s.currency}).`;
  }
  if (s.nearingLimit) {
    return `Spend is approaching the planned budget limit (${s.currency}).`;
  }
  return `Planned vs actual tracked in ${s.currency}.`;
}

function buildActionFocus(
  control: ProjectReviewPack["control"],
  handoverReady: boolean,
  summary: ProjectSummary
): string[] {
  const out: string[] = [];
  const sig = control.signals;
  if (sig.budgetOverBudget || summary.budgetNearingLimit) {
    out.push("Review cost position and variance with finance / project lead.");
  }
  if (!handoverReady && sig.handoverBlockerCount > 0) {
    out.push("Clear handover blockers in priority order before closing.");
  }
  if (sig.blockingDefectsCount > 0) {
    out.push("Resolve or downgrade blocking punch items before handover.");
  }
  if (sig.pendingApprovalsCount > 0) {
    out.push("Clear document approvals awaiting decision.");
  }
  if (sig.pendingApprovalsCount === 0 && sig.pendingReportApprovalsCount > 0) {
    out.push("Review submitted field reports in Approvals.");
  }
  if (sig.pendingClientRequestsCount > 0 || sig.openDiscussionsCount > 0) {
    out.push("Respond to client requests and open discussions.");
  }
  if (sig.activeAftercareCount > 0) {
    out.push("Triage open aftercare / warranty requests.");
  }
  if (summary.commercialOverdueCount > 0) {
    out.push("Clear overdue commercial billing lines and confirm payment status.");
  }
  if (out.length === 0) {
    out.push("Maintain current cadence; no single dominant executive action.");
  }
  return out.slice(0, 6);
}

function commercialNarrative(summary: ProjectSummary): string {
  if (summary.commercialItemCount === 0) {
    return "No commercial billing lines recorded yet.";
  }
  if (summary.commercialOverdueCount > 0) {
    return `${summary.commercialOverdueCount} line(s) overdue or unpaid past due date. Open ${summary.commercialOutstandingAmount.toLocaleString()} ${summary.budgetCurrency} outstanding (lines matching budget currency).`;
  }
  return `${summary.commercialItemCount} billing line(s). Open ${summary.commercialOutstandingAmount.toLocaleString()} ${summary.budgetCurrency} outstanding (issued / due / overdue, matching budget currency).`;
}

export async function buildProjectReviewPack(
  supabase: SupabaseClient,
  tenantId: string,
  project: { id: string; name: string },
  userId: string
): Promise<ProjectReviewPack> {
  const summary = await getProjectSummary(supabase, project.id, tenantId);
  const [handover, attention, control] = await Promise.all([
    computeHandoverReadinessFromSummary(supabase, project.id, tenantId, summary),
    getProjectAttentionSummary(supabase, project.id, tenantId, "manager"),
    buildPortfolioProjectControlRow(supabase, tenantId, project, { cachedSummary: summary }),
  ]);

  const topBlockers: ReviewPackBlockerLine[] = handover.blockers.slice(0, 5).map((b) => ({
    title: b.title,
    detail: b.detail,
    severity: b.severity === "blocking" ? "critical" : "warning",
    href: b.href,
  }));

  const recentChanges = (
    await getStakeholderActivityTimeline(supabase, {
      tenantId,
      projectId: project.id,
      viewer: "manager",
      userId,
      limit: 5,
    })
  ).map((ev) => ({
    title: ev.title,
    occurredAt: ev.occurredAt,
    href: ev.targetUrl ?? control.projectHref,
  }));

  const attentionSections = attention.sections.map((sec) => ({
    label: sec.label,
    count: sec.items.length,
    severity: sec.severity,
  }));

  const execSummary = control.primaryReason;

  return {
    generatedAt: new Date().toISOString(),
    projectId: project.id,
    projectName: project.name,
    header: {
      executiveSignal: control.portfolioState,
      executiveSummary: execSummary,
      projectStatusLabel: statusLabel(control.projectStatus as ProjectStatus),
      healthLabel: healthLabel(control.derivedHealthLevel),
      meta: {
        whyItMatters: "Condensed view for leadership review without opening every tab.",
        summarizes: "Portfolio control posture, budget, handover, aftercare, and recent client/stakeholder activity.",
        expectedAction: "Use action focus and drilldown links to drive the next decisions.",
      },
    },
    control,
    budget: {
      currency: summary.budgetCurrency,
      plannedTotal: summary.budgetPlannedTotal,
      actualTotal: summary.budgetActualTotal,
      varianceAmount: summary.budgetVarianceAmount,
      overBudget: summary.budgetOverBudget,
      nearingLimit: summary.budgetNearingLimit,
      narrative: budgetNarrative({
        overBudget: summary.budgetOverBudget,
        nearingLimit: summary.budgetNearingLimit,
        planned: summary.budgetPlannedTotal,
        actual: summary.budgetActualTotal,
        currency: summary.budgetCurrency,
      }),
    },
    handover: {
      ready: handover.ready,
      blockerCount: handover.blockers.length,
      topBlockers: topBlockers.slice(0, 3),
    },
    aftercare: {
      openCount: control.signals.activeAftercareCount,
      narrative:
        control.signals.activeAftercareCount > 0
          ? `${control.signals.activeAftercareCount} open service request(s) require triage or follow-up.`
          : "No open aftercare requests.",
      href: `${control.projectHref}?tab=aftercare`,
    },
    attention: {
      totalPendingDecisions: summary.pendingDecisionsCount,
      totalOpenIssues: summary.openIssuesCount,
      sections: attentionSections.slice(0, 12),
    },
    blockers: topBlockers,
    recentChanges,
    actionFocus: buildActionFocus(control, handover.ready, summary),
    commercial: {
      itemCount: summary.commercialItemCount,
      overdueCount: summary.commercialOverdueCount,
      outstandingAmount: summary.commercialOutstandingAmount,
      currency: summary.budgetCurrency,
      narrative: commercialNarrative(summary),
      href: `${control.projectHref}?tab=commercial`,
    },
  };
}
