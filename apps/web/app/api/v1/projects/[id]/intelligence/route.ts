/**
 * GET /api/v1/projects/:id/intelligence — aggregated AI brain data for UI.
 * Returns health, insights, risk, evidence, reporting, executive summary, recommendations.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { getOrCreateRequestId, addRequestIdToResponse } from "@/lib/observability/trace";
import { logIntelligenceComplete, logIntelligenceError } from "@/lib/observability/ai-telemetry";
import { getManagerInsights, getExecutiveSummaryForProject } from "@/lib/ai-brain/use-cases";
import {
  getRiskOverviewForProject,
  getEvidenceCoverageForProject,
  getReportingDisciplineForProject,
  getActionRecommendationsForProject,
} from "@/lib/ai-brain/use-cases";
import {
  getProjectHealth,
  getMissingEvidenceInsights,
  getTopRiskInsights,
  getExecutiveProjectSummary,
  getProjectHealthScore,
} from "@/lib/ai-brain/services";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const startMs = Date.now();
  const requestId = getOrCreateRequestId(request);
  const { id } = await context.params;
  if (!id) {
    return addRequestIdToResponse(NextResponse.json({ error: "Missing id" }, { status: 400 }), requestId);
  }

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      logIntelligenceError({
        request_id: requestId,
        route: "GET /api/v1/projects/:id/intelligence",
        tenant_id: ctx.tenantId,
        latency_ms: Date.now() - startMs,
        error_kind: "auth_failure",
      });
      return addRequestIdToResponse(NextResponse.json({ error: e.message }, { status: 401 }), requestId);
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, id);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    logIntelligenceError({
      request_id: requestId,
      route: "GET /api/v1/projects/:id/intelligence",
      tenant_id: ctx.tenantId,
      project_id: id,
      latency_ms: Date.now() - startMs,
      error_kind: status === 403 ? "tenant_failure" : "validation_failure",
    });
    return addRequestIdToResponse(NextResponse.json({ error: projectError ?? "Not found" }, { status }), requestId);
  }

  const tenantId = ctx.tenantId!;
  let health, insights, riskOverview, evidenceCoverage, reportingDiscipline, executiveSummary, recommendations, missingEvidenceInsights, topRiskInsights, executiveProjectSummary, projectHealthScore;
  try {
    [
      health,
      insights,
      riskOverview,
      evidenceCoverage,
      reportingDiscipline,
      executiveSummary,
      recommendations,
      missingEvidenceInsights,
      topRiskInsights,
      executiveProjectSummary,
      projectHealthScore,
    ] = await Promise.all([
    getProjectHealth(supabase, id, tenantId),
    getManagerInsights(supabase, id, tenantId),
    getRiskOverviewForProject(supabase, id, tenantId),
    getEvidenceCoverageForProject(supabase, id, tenantId),
    getReportingDisciplineForProject(supabase, id, tenantId),
    getExecutiveSummaryForProject(supabase, id, tenantId),
    getActionRecommendationsForProject(supabase, id, tenantId),
    getMissingEvidenceInsights(supabase, id, tenantId),
    getTopRiskInsights(supabase, id, tenantId, 10),
    getExecutiveProjectSummary(supabase, id, tenantId),
    getProjectHealthScore(supabase, id, tenantId),
  ]);
  } catch (e) {
    logIntelligenceError({
      request_id: requestId,
      route: "GET /api/v1/projects/:id/intelligence",
      tenant_id: tenantId,
      project_id: id,
      latency_ms: Date.now() - startMs,
      error_kind: "unknown_internal_error",
    });
    const res = NextResponse.json({ error: "Intelligence computation failed" }, { status: 503 });
    return addRequestIdToResponse(res, requestId);
  }

  const dataSufficiency = executiveProjectSummary?.dataSufficiency;
  const healthScore = projectHealthScore?.score ?? health?.score;
  const insightsCount =
    (missingEvidenceInsights?.length ?? 0) +
    (topRiskInsights?.length ?? 0) +
    (insights?.length ?? 0);
  const missingDataDisclaimer =
    (executiveProjectSummary?.missingDataDisclaimer != null) ||
    (projectHealthScore?.missingDataDisclaimer != null);

  logIntelligenceComplete({
    request_id: requestId,
    route: "GET /api/v1/projects/:id/intelligence",
    tenant_id: tenantId,
    project_id: id,
    user_id: ctx.userId ?? undefined,
    latency_ms: Date.now() - startMs,
    output_type: "intelligence",
    data_sufficiency: dataSufficiency,
    health_score: healthScore,
    insights_count: insightsCount,
    missing_data_disclaimer: missingDataDisclaimer,
  });

  const response = NextResponse.json({
    data: {
      health: health ?? undefined,
      insights: insights ?? [],
      riskOverview: riskOverview ?? { high: 0, medium: 0, low: 0, signals: [] },
      evidenceCoverage: evidenceCoverage ?? { signals: [] },
      reportingDiscipline: reportingDiscipline ?? { signals: [] },
      executiveSummary: executiveSummary ?? undefined,
      recommendations: recommendations ?? [],
      missingEvidenceInsights: missingEvidenceInsights ?? [],
      topRiskInsights: topRiskInsights ?? [],
      executiveProjectSummary: executiveProjectSummary ?? undefined,
      projectHealthScore: projectHealthScore ?? undefined,
    },
  });
  return addRequestIdToResponse(response, requestId);
}
