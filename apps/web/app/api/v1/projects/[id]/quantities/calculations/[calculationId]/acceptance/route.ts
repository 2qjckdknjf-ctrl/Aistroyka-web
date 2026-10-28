/**
 * POST /api/v1/projects/:id/quantities/calculations/:calculationId/acceptance
 * Stage2a A04 manager human acceptance of an immutable calculation revision.
 * Does not create commercial lines (A05) and never exposes prices here.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { recordQuantityAcceptance } from "@/lib/domain/quantities/quantity-acceptance.service";
import { isQuantityCommerciallyBindable } from "@/lib/domain/quantities/quantity-acceptance";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; calculationId: string }> }
) {
  const { id: projectId, calculationId } = await context.params;
  if (!projectId || !calculationId) {
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

  // Acceptance is owner/admin only — members report quantities (A03) but do not accept.
  if (ctx.role !== "owner" && ctx.role !== "admin") {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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

  const result = await recordQuantityAcceptance(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    calculationRevisionId: calculationId,
    actorUserId: ctx.userId!,
    decision: body.decision ?? body.status ?? body.verdict,
    note: typeof body.note === "string" ? body.note : null,
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT"
        ? 400
        : result.code === "NOT_FOUND"
          ? 404
          : result.code === "CONFLICT"
            ? 409
            : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "quantity_calculation_acceptance",
    resource_type: "quantity_acceptance_decision",
    resource_id: result.decision.id,
    details: {
      project_id: projectId,
      calculation_revision_id: calculationId,
      decision: result.decision.decision,
      commercially_bindable: isQuantityCommerciallyBindable(result.decision.decision),
      source: "manager",
    },
  });

  return NextResponse.json(
    {
      data: {
        ...result.decision,
        commercially_bindable: isQuantityCommerciallyBindable(result.decision.decision),
      },
    },
    { status: 201 }
  );
}
