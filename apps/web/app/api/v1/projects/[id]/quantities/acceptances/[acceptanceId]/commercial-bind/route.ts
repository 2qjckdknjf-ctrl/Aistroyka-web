/**
 * POST /api/v1/projects/:id/quantities/acceptances/:acceptanceId/commercial-bind
 * Stage2a A05: bind commercial.stage2a.v1 result to an accepted quantity.
 * Contractor-internal owner/admin only. Never a portal/customer surface.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { bindAcceptedQuantityCommercial } from "@/lib/domain/quantities/quantity-commercial-bind.service";
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

  const commercialInput = body.commercial ?? body.input ?? body;
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

  const result = await bindAcceptedQuantityCommercial(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    actorUserId: ctx.userId!,
    acceptanceDecisionId: acceptanceId,
    commercialInput,
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT" || result.code === "COMMERCIAL_INVALID"
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
    action: "quantity_commercial_binding_created",
    resource_type: "quantity_commercial_binding",
    resource_id: result.binding.id,
    details: {
      project_id: projectId,
      acceptance_decision_id: acceptanceId,
      work_spec_hash: result.binding.work_spec_hash,
      source: "manager",
      // Do not audit raw totals into customer-visible channels; audit_logs are contractor-internal.
    },
  });

  return NextResponse.json({ data: result.binding }, { status: 201 });
}
