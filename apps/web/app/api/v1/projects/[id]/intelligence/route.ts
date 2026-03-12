/**
 * GET /api/v1/projects/:id/intelligence — aggregated AI brain data for UI.
 * Returns health, insights, risk, evidence, reporting, executive summary, recommendations.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { getManagerInsights, getExecutiveSummaryForProject } from "@/lib/ai-brain/use-cases";
import {
  getRiskOverviewForProject,
  getEvidenceCoverageForProject,
  getReportingDisciplineForProject,
  getActionRecommendationsForProject,
} from "@/lib/ai-brain/use-cases";
import { getProjectHealth } from "@/lib/ai-brain/services";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const { data: project, error: projectError } = await getProject(supabase, ctx, id);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const tenantId = ctx.tenantId!;
  const [health, insights, riskOverview, evidenceCoverage, reportingDiscipline, executiveSummary, recommendations] =
    await Promise.all([
      getProjectHealth(supabase, id, tenantId),
      getManagerInsights(supabase, id, tenantId),
      getRiskOverviewForProject(supabase, id, tenantId),
      getEvidenceCoverageForProject(supabase, id, tenantId),
      getReportingDisciplineForProject(supabase, id, tenantId),
      getExecutiveSummaryForProject(supabase, id, tenantId),
      getActionRecommendationsForProject(supabase, id, tenantId),
    ]);

  return NextResponse.json({
    data: {
      health: health ?? undefined,
      insights: insights ?? [],
      riskOverview: riskOverview ?? { high: 0, medium: 0, low: 0, signals: [] },
      evidenceCoverage: evidenceCoverage ?? { signals: [] },
      reportingDiscipline: reportingDiscipline ?? { signals: [] },
      executiveSummary: executiveSummary ?? undefined,
      recommendations: recommendations ?? [],
    },
  });
}
