/**
 * POST /api/v1/projects/:id/estimate/from-image — run cost estimate from one image URL, persist result.
 * Body: { image_url: string }
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { canManageProjects } from "@/lib/tenant/tenant.policy";
import { getById as getProjectById } from "@/lib/domain/projects/project.repository";
import { getTierForTenant } from "@/lib/platform/subscription/subscription.service";
import { analyzeImageForCost, CostVisionFailedError } from "@/lib/domain/estimate/estimate-cost.service";
import { getProjectEstimateSummary, createResult } from "@/lib/domain/estimate/estimate.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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

  let body: { image_url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const imageUrl = typeof body?.image_url === "string" ? body.image_url.trim() : "";
  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image_url in body" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      { error: "Estimate processing requires server configuration" },
      { status: 503 }
    );
  }

  const project = await getProjectById(supabase, projectId, ctx.tenantId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const tier = await getTierForTenant(supabase, ctx.tenantId);

  let output;
  try {
    output = await analyzeImageForCost(admin, {
      imageUrl,
      tenantId: ctx.tenantId,
      userId: ctx.userId ?? null,
      subscriptionTier: tier ?? "free",
      traceId: request.headers.get("x-request-id")?.trim() ?? undefined,
    });
  } catch (e) {
    if (e instanceof CostVisionFailedError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    throw e;
  }

  const result = await createResult(supabase, ctx.tenantId, ctx.userId ?? null, {
    project_id: projectId,
    source_type: "image",
    source_ref: null,
    work_categories: output.work_categories.length ? output.work_categories : null,
    rough_range_min: output.rough_range_min,
    rough_range_max: output.rough_range_max,
    currency_hint: output.currency_hint,
    confidence: output.confidence,
    missing_data_reasons:
      output.missing_data_reasons.length ? output.missing_data_reasons : null,
    assumption_notes: output.assumption_notes,
    status: "generated",
  });

  if (!result) {
    return NextResponse.json({ error: "Failed to save estimate result" }, { status: 500 });
  }

  const summary = await getProjectEstimateSummary(supabase, {
    projectId,
    tenantId: ctx.tenantId,
  });

  return NextResponse.json({
    data: {
      result,
      summary,
    },
  });
}
