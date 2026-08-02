/**
 * GET /api/v1/plan-fit/recommend/latest — latest recommendation for current workspace.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getWorkspaceLatestPlanRecommendation } from "@/lib/platform/plan-fit/plan-fit-backend.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const { data } = await getWorkspaceLatestPlanRecommendation(supabase, ctx.tenantId);
  if (!data) {
    return NextResponse.json({ recommendation: null }, { status: 200 });
  }
  return NextResponse.json({
    recommendation: {
      id: data.id,
      tenantId: data.tenantId,
      userId: data.userId,
      inputSnapshot: data.inputSnapshot,
      recommendedPlanCode: data.recommendedPlanCode,
      alternativePlanCodes: data.alternativePlanCodes,
      enterpriseSignal: data.enterpriseSignal,
      reasoningCodes: data.reasoningCodes,
      createdAt: data.createdAt,
    },
  });
}
