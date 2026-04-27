/**
 * GET /api/v1/portfolio/summary
 * Portfolio command view: aggregated health, risk, evidence, budget, actions across tenant projects.
 * Uses existing project-level services; limit 15 projects to avoid timeout.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listByTenant } from "@/lib/domain/projects/project.repository";
import { getBudgetSummary } from "@/lib/domain/costs/cost.service";
import { getProjectHealthScore } from "@/lib/ai-brain/services/project-health-v2.service";
import {
  getRiskOverviewForProject,
  getEvidenceCoverageForProject,
  getActionRecommendationsForProject,
} from "@/lib/ai-brain/use-cases";
import { countOpenGovernanceCases } from "@/lib/domain/governance/governance.repository";
import { countTenantCommercialOverdue } from "@/lib/domain/commercial/commercial.repository";
import { getMissingEvidenceInsights, getTopRiskInsights } from "@/lib/ai-brain/services";

export const dynamic = "force-dynamic";

const MAX_PROJECTS = 15;

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const tenantId = ctx.tenantId!;
  const [govCounts, commercialSignals] = await Promise.all([
    countOpenGovernanceCases(supabase, tenantId),
    countTenantCommercialOverdue(supabase, tenantId),
  ]);
  const projects = await listByTenant(supabase, tenantId);
  const limited = projects.slice(0, MAX_PROJECTS);

  type ProjectRow = (typeof limited)[number];
  const results = await Promise.all(
    limited.map(async (p: ProjectRow) => {
      const [
        healthScoreRes,
        riskRes,
        evidenceRes,
        missingRes,
        topRisksRes,
        recommendationsRes,
        budgetRes,
      ] = await Promise.all([
        getProjectHealthScore(supabase, p.id, tenantId),
        getRiskOverviewForProject(supabase, p.id, tenantId),
        getEvidenceCoverageForProject(supabase, p.id, tenantId),
        getMissingEvidenceInsights(supabase, p.id, tenantId),
        getTopRiskInsights(supabase, p.id, tenantId, 3),
        getActionRecommendationsForProject(supabase, p.id, tenantId),
        getBudgetSummary(supabase, ctx, p.id),
      ]);

      const health = healthScoreRes ?? null;
      const riskOverview = riskRes ?? { high: 0, medium: 0, low: 0, signals: [] };
      const evidenceSignals = evidenceRes?.signals ?? [];
      const missingInsights = missingRes ?? [];
      const topRisks = topRisksRes ?? [];
      const recommendations = recommendationsRes ?? [];
      const summary = budgetRes.data ?? null;

      const reasons: string[] = [];
      if (health?.label === "critical") reasons.push("Critical health");
      else if (health?.label === "unstable") reasons.push("Unstable health");
      if ((riskOverview.high ?? 0) > 0) reasons.push("High risks");
      if (missingInsights.length > 0) reasons.push(`${missingInsights.length} evidence gap(s)`);
      if (summary?.over_budget) reasons.push("Over budget");
      if (summary && summary.variance_amount < 0 && Math.abs(summary.variance_amount) > 0)
        reasons.push("Budget variance");
      if (health && "confidence" in health && health.confidence && health.confidence.toLowerCase().includes("low"))
        reasons.push("Low confidence");
      if (reasons.length === 0 && (evidenceSignals.length > 0 || topRisks.length > 0))
        reasons.push("Risks or evidence gaps");

      return {
        id: p.id,
        name: p.name,
        healthScore: health?.score ?? null,
        healthLabel: health?.label ?? null,
        riskHigh: riskOverview.high ?? 0,
        riskMedium: riskOverview.medium ?? 0,
        riskLow: riskOverview.low ?? 0,
        evidenceGapCount: evidenceSignals.length,
        missingEvidenceCount: missingInsights.length,
        overBudget: summary?.over_budget ?? false,
        varianceAmount: summary?.variance_amount ?? 0,
        topRisks: topRisks.slice(0, 3).map((r) => ({ title: r.title, severity: r.severity })),
        requiresAttentionReasons: reasons,
        confidence: health && "confidence" in health ? health.confidence : null,
        recommendations: recommendations.slice(0, 2).map((rec) => ({
          title: rec.title,
          priority: rec.priority,
          relatedResourceType: rec.relatedResourceType,
          relatedResourceId: rec.relatedResourceId,
        })),
      };
    })
  );

  const distribution = {
    healthy: results.filter((r) => r.healthLabel === "healthy").length,
    moderate: results.filter((r) => r.healthLabel === "moderate").length,
    unstable: results.filter((r) => r.healthLabel === "unstable").length,
    critical: results.filter((r) => r.healthLabel === "critical").length,
    lowConfidence: results.filter(
      (r) => r.confidence && String(r.confidence).toLowerCase().includes("low")
    ).length,
    noData: results.filter((r) => r.healthLabel == null && r.healthScore == null).length,
  };

  const budgetPressure = results
    .filter((r) => r.overBudget || (r.varianceAmount !== 0 && Math.abs(r.varianceAmount) > 0))
    .map((r) => ({
      projectId: r.id,
      projectName: r.name,
      overBudget: r.overBudget,
      varianceAmount: r.varianceAmount,
    }));

  const portfolioRisks = results.flatMap((r) =>
    (r.topRisks ?? []).map((tr) => ({
      projectId: r.id,
      projectName: r.name,
      title: tr.title,
      severity: tr.severity,
    }))
  ).sort((a, b) => (a.severity === "high" ? -1 : b.severity === "high" ? 1 : 0)).slice(0, 10);

  const recommendedActions = results.flatMap((r) =>
    (r.recommendations ?? []).map((rec) => ({
      projectId: r.id,
      projectName: r.name,
      title: rec.title,
      priority: rec.priority,
      relatedResourceType: rec.relatedResourceType,
      relatedResourceId: rec.relatedResourceId,
    }))
  ).slice(0, 7);

  return NextResponse.json({
    data: {
      projects: results,
      distribution,
      budgetPressure,
      portfolioRisks,
      recommendedActions,
      totalProjects: projects.length,
      limitedTo: limited.length,
      governanceOpenCount: govCounts.open,
      governanceCriticalOpenCount: govCounts.criticalOpen,
      commercialOverdueCount: commercialSignals.overdueCount,
      commercialOpenUnpaidCount: commercialSignals.openUnpaidCount,
    },
  });
}
