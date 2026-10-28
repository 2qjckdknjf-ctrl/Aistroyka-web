/**
 * POST /api/v1/projects/:id/materials/requirement-drafts/:draftId/fixture-offers
 * Seed manual/fixture supplier offers for draft comparison rehearsal.
 * No outbound Search & Fetch. No order/pay/message.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { addMaterialSupplierQuoteDraft } from "@/lib/domain/materials/material-requirement-draft.service";
import { loadFixtureSupplierOffers } from "@/lib/domain/materials/supplier-offer.fixture-adapter";
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

  const asOf = new Date().toISOString().slice(0, 10);
  const fixtures = loadFixtureSupplierOffers(asOf);
  const created: string[] = [];
  for (const offer of fixtures) {
    const result = await addMaterialSupplierQuoteDraft(supabase, {
      tenantId: ctx.tenantId!,
      projectId,
      actorUserId: ctx.userId!,
      materialRequirementDraftId: draftId,
      supplierName: offer.supplier_name,
      sku: offer.sku,
      packageLabel: offer.package_label,
      unitPriceMinor: offer.unit_price_minor,
      coverageQuantity: offer.coverage_quantity,
      region: offer.region,
      shippingNote: null,
      stockStatus: offer.stock_status,
      leadTimeDays: offer.lead_time_days,
      quoteDatedAt: offer.quote_dated_at,
      quoteExpiresAt: offer.quote_expires_at,
      provenanceNote: offer.provenance_note,
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error, code: result.code }, { status: 400 });
    }
    created.push(result.quote.id);
  }

  await emitAudit(supabase, {
    tenant_id: ctx.tenantId!,
    user_id: ctx.userId,
    action: "material_supplier_fixture_offers_seeded",
    resource_type: "material_requirement_draft",
    resource_id: draftId,
    details: { project_id: projectId, inserted: created.length, source: "fixture" },
  });

  return NextResponse.json({ data: { offer_ids: created } }, { status: 201 });
}
