/**
 * POST /api/v1/projects/:id/materials/requirement-drafts/:draftId/quotes
 * AIS-MATERIAL-008: dated supplier quote draft for comparison only.
 * No order, payment, or supplier messaging. Contractor-internal owner/admin.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { addMaterialSupplierQuoteDraft } from "@/lib/domain/materials/material-requirement-draft.service";
import { emitAudit } from "@/lib/observability/audit.service";

export const dynamic = "force-dynamic";

function asOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? value : null;
}

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

  const stockRaw = typeof body.stock_status === "string" ? body.stock_status : body.stockStatus;
  const stockStatus =
    stockRaw === "in_stock" || stockRaw === "out_of_stock" || stockRaw === "lead_time"
      ? stockRaw
      : "unknown";

  const leadRaw = body.lead_time_days ?? body.leadTimeDays;
  const leadTimeDays =
    typeof leadRaw === "number" && Number.isFinite(leadRaw) ? Math.trunc(leadRaw) : null;

  const result = await addMaterialSupplierQuoteDraft(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    actorUserId: ctx.userId!,
    materialRequirementDraftId: draftId,
    supplierName: typeof body.supplier_name === "string" ? body.supplier_name : String(body.supplierName ?? ""),
    sku: asOptionalString(body.sku),
    packageLabel: asOptionalString(body.package_label ?? body.packageLabel),
    unitPriceMinor:
      typeof body.unit_price_minor === "string"
        ? body.unit_price_minor
        : typeof body.unitPriceMinor === "string"
          ? body.unitPriceMinor
          : "",
    coverageQuantity: asOptionalString(body.coverage_quantity ?? body.coverageQuantity),
    region: asOptionalString(body.region),
    shippingNote: asOptionalString(body.shipping_note ?? body.shippingNote),
    stockStatus,
    leadTimeDays,
    quoteDatedAt:
      typeof body.quote_dated_at === "string"
        ? body.quote_dated_at
        : typeof body.quoteDatedAt === "string"
          ? body.quoteDatedAt
          : "",
    quoteExpiresAt: asOptionalString(body.quote_expires_at ?? body.quoteExpiresAt),
    provenanceNote: asOptionalString(body.provenance_note ?? body.provenanceNote),
  });

  if (!result.ok) {
    const http =
      result.code === "INVALID_INPUT"
        ? 400
        : result.code === "NOT_FOUND"
          ? 404
          : 500;
    return NextResponse.json({ error: result.error, code: result.code }, { status: http });
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "material_supplier_quote_draft_created",
    resource_type: "material_supplier_quote_draft",
    resource_id: result.quote.id,
    details: {
      project_id: projectId,
      material_requirement_draft_id: draftId,
      stock_status: result.quote.stock_status,
      source: "manager",
    },
  });

  return NextResponse.json({ data: result.quote }, { status: 201 });
}
