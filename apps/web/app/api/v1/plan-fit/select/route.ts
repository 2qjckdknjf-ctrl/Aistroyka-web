/**
 * POST /api/v1/plan-fit/select — set selected canonical plan for workspace.
 * Selected plan != billing subscription.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { selectWorkspacePlan } from "@/lib/platform/plan-fit/plan-fit-backend.service";
import { PlanFitSelectRequestSchema } from "@/lib/platform/plan-fit/plan-fit-api.schema";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
  if (!canManageProjects(ctx) || !ctx.tenantId) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = PlanFitSelectRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await selectWorkspacePlan(supabase, {
    tenantId: ctx.tenantId,
    canonicalPlanCode: parsed.data.canonicalPlanCode,
    sourceKind: parsed.data.sourceKind,
    selectedByUserId: ctx.userId ?? null,
    addOnCodes: parsed.data.addOnCodes,
  });
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }
  return NextResponse.json({
    tenantId: data.tenantId,
    canonicalPlanCode: data.canonicalPlanCode,
    sourceKind: parsed.data.sourceKind,
    selectedAt: data.selectedAt,
  });
}
