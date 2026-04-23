/**
 * POST /api/v1/plan-fit/recommend — submit plan-fit answers, run recommendation, persist.
 * Recommendation != selection. Does not change selected plan.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { submitPlanFitRecommendation } from "@/lib/platform/plan-fit/plan-fit-backend.service";
import { PlanFitRecommendRequestSchema } from "@/lib/platform/plan-fit/plan-fit-api.schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!canManageProjects(ctx) || !ctx.tenantId) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PlanFitRecommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await submitPlanFitRecommendation(supabase, {
    tenantId: ctx.tenantId,
    userId: ctx.userId ?? null,
    input: parsed.data,
  });
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
  return NextResponse.json({
    id: data.id,
    recommendedPlanCode: data.recommendation.recommendedPlanCode,
    alternativePlanCodes: data.recommendation.alternativePlanCodes,
    enterpriseSignal: data.recommendation.enterpriseSignal,
    reasoningCodes: data.recommendation.reasoningCodes,
    createdAt: data.createdAt,
  });
}
