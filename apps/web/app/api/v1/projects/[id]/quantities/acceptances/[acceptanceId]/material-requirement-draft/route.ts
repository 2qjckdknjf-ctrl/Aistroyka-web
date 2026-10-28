/**
 * POST /api/v1/projects/:id/quantities/acceptances/:acceptanceId/material-requirement-draft
 * AIS-MATERIAL-008: material need draft from accepted quantity. No order/pay/message.
 * Contractor-internal owner/admin only.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { createMaterialRequirementDraft } from "@/lib/domain/materials/material-requirement-draft.service";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; acceptanceId: string }> }
) {
  const { id: projectId, acceptanceId } = await context.params;
  if (!projectId || !acceptanceId) {
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const workQuantity =
    typeof body.work_quantity === "string"
      ? body.work_quantity
      : typeof body.workQuantity === "string"
        ? body.workQuantity
        : "";
  const consumption =
    typeof body.consumption === "string"
      ? body.consumption
      : body.consumption === null
        ? null
        : undefined;
  const waste =
    typeof body.waste === "string" ? body.waste : body.waste === null ? null : undefined;
  const packCoverage =
    typeof body.pack_coverage === "string"
      ? body.pack_coverage
      : typeof body.packCoverage === "string"
        ? body.packCoverage
        : body.pack_coverage === null || body.packCoverage === null
          ? null
          : undefined;

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

  const result = await createMaterialRequirementDraft(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    actorUserId: ctx.userId!,
    acceptanceDecisionId: acceptanceId,
    workQuantity,
    consumption: consumption === undefined ? null : consumption,
    waste: waste === undefined ? null : waste,
    packCoverage: packCoverage === undefined ? null : packCoverage,
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT"
        ? 400
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "NOT_ACCEPTED"
            ? 422
            : result.code === "CONFLICT"
              ? 409
              : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "material_requirement_draft_created",
    resource_type: "material_requirement_draft",
    resource_id: result.draft.id,
    details: {
      project_id: projectId,
      acceptance_decision_id: acceptanceId,
      issues: result.draft.issues,
      source: "manager",
    },
  });

  return NextResponse.json({ data: result.draft }, { status: 201 });
}
