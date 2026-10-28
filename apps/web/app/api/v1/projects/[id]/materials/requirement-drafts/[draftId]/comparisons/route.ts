/**
 * POST /api/v1/projects/:id/materials/requirement-drafts/:draftId/comparisons
 * AIS-MATERIAL-008: immutable supplier draft comparison. No order/pay/message.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { createMaterialSupplyDraftComparison } from "@/lib/domain/materials/draft-comparison.service";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; draftId: string }> }
) {
  const { id: projectId, draftId } = await context.params;
  if (!projectId || !draftId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.message.includes("membership") ? 403 : 401 }
      );
    }
    throw e;
  }
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const offerIdsRaw = body.offer_ids ?? body.offerIds;
  const offerIds = Array.isArray(offerIdsRaw)
    ? offerIdsRaw.filter((item): item is string => typeof item === "string" && item.length > 0)
    : null;

  const supabase = await createClientFromRequest(request);
  const membership = await supabase.rpc("is_internal_tenant_writer_for_tenant", {
    p_tenant_id: ctx.tenantId!,
  });
  if (membership.error) {
    return NextResponse.json({ error: membership.error.message }, { status: 500 });
  }
  if (membership.data !== true) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const project = await getProjectRow(supabase, projectId, ctx.tenantId!);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await createMaterialSupplyDraftComparison(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    actorUserId: ctx.userId!,
    materialRequirementDraftId: draftId,
    offerIds,
    asOfDate: typeof body.as_of_date === "string" ? body.as_of_date : null,
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT"
        ? 400
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "NEED_OFFERS"
            ? 422
            : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "material_supply_draft_comparison_created",
    resource_type: "material_supply_draft_comparison",
    resource_id: result.comparison.id,
    details: {
      project_id: projectId,
      material_requirement_draft_id: draftId,
      policy_version: result.comparison.policy_version,
      source: "manager",
    },
  });

  return NextResponse.json({ data: result.comparison }, { status: 201 });
}
