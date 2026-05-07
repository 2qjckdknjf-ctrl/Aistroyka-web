/**
 * PATCH /api/v1/projects/:id/estimates/:estimateId — manager-only draft edit or cancel draft.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { patchCustomerEstimate } from "@/lib/domain/customer-estimates/customer-estimates.service";
import type { PatchCustomerEstimateInput } from "@/lib/domain/customer-estimates/customer-estimates.types";

export const dynamic = "force-dynamic";

function patchFromBody(body: Record<string, unknown>): PatchCustomerEstimateInput | null {
  if (body.status === "cancelled") return { status: "cancelled" };
  const out: PatchCustomerEstimateInput = {};
  if (typeof body.title === "string") out.title = body.title;
  if (body.description === null || typeof body.description === "string") out.description = body.description as string | null;
  if (typeof body.total_amount === "number") out.total_amount = body.total_amount;
  if (typeof body.total_amount === "string" && body.total_amount.trim() !== "") {
    out.total_amount = Number(body.total_amount);
  }
  if (typeof body.currency === "string") out.currency = body.currency;
  if (body.valid_until === null || typeof body.valid_until === "string") {
    out.valid_until = body.valid_until as string | null;
  }
  if (body.linked_document_id === null || typeof body.linked_document_id === "string") {
    out.linked_document_id = body.linked_document_id as string | null;
  }
  if (Object.keys(out).length === 0) return null;
  return out;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; estimateId: string }> }
) {
  const { id: projectId, estimateId } = await context.params;
  if (!projectId || !estimateId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const body = await request.json().catch(() => ({}));
  const patch = patchFromBody(body);
  if (!patch) return NextResponse.json({ error: "No valid patch fields" }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const { data, error } = await patchCustomerEstimate(supabase, ctx, projectId, estimateId, patch);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Update failed" }, { status: 400 });
  return NextResponse.json({ data });
}
