/**
 * GET /api/v1/plan-fit/current — current selected plan state for workspace.
 * Returns null if none set (runtime will use legacy tier or default).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getWorkspaceSelectedPlan } from "@/lib/platform/plan-fit/plan-fit-backend.service";

export const dynamic = "force-dynamic";

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
  if (!ctx.tenantId) {
    return NextResponse.json({ error: "Tenant required" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const { data } = await getWorkspaceSelectedPlan(supabase, ctx.tenantId);
  if (!data) {
    return NextResponse.json({ current: null }, { status: 200 });
  }
  return NextResponse.json({
    current: {
      tenantId: data.tenantId,
      canonicalPlanCode: data.canonicalPlanCode,
      sourceKind: data.sourceKind,
      selectedByUserId: data.selectedByUserId,
      selectedAt: data.selectedAt,
      addOnCodes: data.addOnCodes,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
  });
}
