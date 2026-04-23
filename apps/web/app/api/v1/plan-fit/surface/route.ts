/**
 * GET /api/v1/plan-fit/surface
 * Returns plan surface view model for UI display.
 * Step 10: current plan, limits, capability summary, soft upgrade suggestions.
 * No checkout or billing. Legacy-safe.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getWorkspacePlanContextFromRuntime } from "@/lib/platform/plan-fit";
import { getPlanSurfaceViewModel, getPlanSurfaceFallback } from "@/lib/platform/plan-fit/plan-surface";
import type { PlanCode } from "@aistroyka/contracts";

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

  try {
    const context = await getWorkspacePlanContextFromRuntime(supabase, ctx.tenantId);
    const surface = getPlanSurfaceViewModel(context);
    return NextResponse.json({ surface });
  } catch (err) {
    const safeFallback = getPlanSurfaceFallback("client_personal" as PlanCode);
    return NextResponse.json({
      surface: safeFallback,
      fallback: true,
      error: err instanceof Error ? err.message : "Failed to load plan context",
    });
  }
}
