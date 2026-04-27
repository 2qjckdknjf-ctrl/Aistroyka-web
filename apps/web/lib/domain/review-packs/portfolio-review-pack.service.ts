/**
 * Wave 4 Step 18 — portfolio-level executive review pack.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantContext } from "@/lib/tenant/tenant.types";
import { buildPortfolioControl } from "@/lib/domain/portfolio/portfolio-control.service";
import type { PortfolioProjectControlRow } from "@/lib/domain/portfolio/portfolio-control.types";
import type { PortfolioReviewPack } from "./review-packs.types";
import { countOpenGovernanceCases } from "@/lib/domain/governance/governance.repository";
import { countTenantCommercialOverdue } from "@/lib/domain/commercial/commercial.repository";

const MAX_HIGHLIGHT = 8;

function buildPortfolioNarrative(
  distribution: PortfolioReviewPack["distribution"],
  critical: PortfolioProjectControlRow[],
  attention: PortfolioProjectControlRow[]
): { executiveSignal: PortfolioReviewPack["header"]["executiveSignal"]; narrative: string; summaryLine: string } {
  const { critical: c, attention: a, healthy: h, totalProjects } = distribution;
  if (c > 0) {
    return {
      executiveSignal: "critical",
      narrative: `${c} project(s) in critical portfolio posture (budget, defects, or severe schedule/handover pressure). Address these before expanding scope elsewhere.`,
      summaryLine: `${totalProjects} project(s) total · ${c} critical · ${a} need attention · ${h} healthy (within sampled set).`,
    };
  }
  if (a > 0) {
    return {
      executiveSignal: "attention",
      narrative: `No critical projects in the current sample, but ${a} project(s) need leadership follow-up (approvals, client items, aftercare, or schedule).`,
      summaryLine: `${totalProjects} project(s) total · ${a} need attention · ${h} healthy.`,
    };
  }
  return {
    executiveSignal: "healthy",
    narrative: "Sampled projects are in a stable posture. Continue routine reviews and monitor workload inbox.",
    summaryLine: `${totalProjects} project(s) in sample · all healthy at this snapshot.`,
  };
}

function buildPortfolioActionFocus(rows: PortfolioProjectControlRow[]): string[] {
  const critical = rows.filter((r) => r.portfolioState === "critical");
  const attention = rows.filter((r) => r.portfolioState === "attention");
  const out: string[] = [];
  if (critical.length > 0) {
    out.push(`Prioritize ${critical.length} critical project(s): clear dominant blockers per project row.`);
  }
  const budgetCritical = critical.filter((r) => r.signals.budgetOverBudget).length;
  if (budgetCritical > 0) {
    out.push(`${budgetCritical} critical project(s) have budget pressure — align with cost tabs.`);
  }
  if (attention.length > 0 && critical.length === 0) {
    out.push(`Review ${attention.length} attention project(s) for decisions and client/stakeholder follow-through.`);
  }
  if (out.length === 0) {
    out.push("Keep weekly portfolio review cadence; no urgent cross-portfolio escalation from this snapshot.");
  }
  return out.slice(0, 5);
}

export async function buildPortfolioReviewPack(
  supabase: SupabaseClient,
  ctx: TenantContext
): Promise<PortfolioReviewPack> {
  const result = await buildPortfolioControl(supabase, ctx);
  const [gov, commercial] =
    ctx.tenantId != null
      ? await Promise.all([
          countOpenGovernanceCases(supabase, ctx.tenantId),
          countTenantCommercialOverdue(supabase, ctx.tenantId),
        ])
      : [{ open: 0, criticalOpen: 0 }, { overdueCount: 0, openUnpaidCount: 0 }];
  const projects = result.projects;
  const criticalProjects = projects.filter((p) => p.portfolioState === "critical").slice(0, MAX_HIGHLIGHT);
  const attentionProjects = projects.filter((p) => p.portfolioState === "attention").slice(0, MAX_HIGHLIGHT);
  const healthyCount = projects.filter((p) => p.portfolioState === "healthy").length;

  const distribution = {
    healthy: result.distribution.healthy,
    attention: result.distribution.attention,
    critical: result.distribution.critical,
    totalProjects: result.totalProjects,
    limitedTo: result.limitedTo,
  };

  const { executiveSignal, narrative, summaryLine } = buildPortfolioNarrative(distribution, criticalProjects, attentionProjects);

  return {
    generatedAt: new Date().toISOString(),
    header: {
      executiveSignal,
      narrative,
      summaryLine,
      meta: {
        whyItMatters: "Leadership needs a single coherent portfolio snapshot without exporting spreadsheets.",
        summarizes: "Portfolio control states (healthy / attention / critical) with dominant reasons per project.",
        expectedAction: "Drill into critical and attention projects first; use distribution to allocate time.",
      },
    },
    distribution,
    criticalProjects,
    attentionProjects,
    healthyCount,
    actionFocus: buildPortfolioActionFocus(projects),
    governanceEscalations: {
      openCount: gov.open,
      criticalOpenCount: gov.criticalOpen,
    },
    commercialSignals: {
      overdueCount: commercial.overdueCount,
      openUnpaidCount: commercial.openUnpaidCount,
    },
  };
}
