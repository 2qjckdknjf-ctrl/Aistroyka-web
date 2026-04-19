/**
 * GET/PATCH /api/v1/projects/:id/commercial-items/:itemId
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { getCommercialItem, updateCommercialItem } from "@/lib/domain/commercial/commercial.service";
import type {
  CommercialItemKind,
  CommercialItemStatus,
  UpdateCommercialItemInput,
} from "@/lib/domain/commercial/commercial.types";

export const dynamic = "force-dynamic";

const KINDS: CommercialItemKind[] = [
  "invoice",
  "expected_revenue",
  "deposit",
  "credit_note",
  "other",
];

const STATUSES: CommercialItemStatus[] = [
  "draft",
  "issued",
  "due",
  "overdue",
  "paid",
  "cancelled",
];

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: projectId, itemId } = await context.params;
  if (!projectId || !itemId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getCommercialItem(supabase, ctx, projectId, itemId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (error === "Not found") return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  const { id: projectId, itemId } = await context.params;
  if (!projectId || !itemId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const patch: UpdateCommercialItemInput = {};
  if (typeof body.kind === "string" && KINDS.includes(body.kind as CommercialItemKind)) {
    patch.kind = body.kind as CommercialItemKind;
  }
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.description === "string" || body.description === null) {
    patch.description = body.description === null ? null : String(body.description);
  }
  if (typeof body.amount === "number" || typeof body.amount === "string") {
    const n = typeof body.amount === "number" ? body.amount : Number(body.amount);
    if (Number.isFinite(n)) patch.amount = n;
  }
  if (typeof body.currency === "string") patch.currency = body.currency;
  if (typeof body.due_date === "string" || body.due_date === null) {
    patch.due_date = body.due_date === null ? null : String(body.due_date);
  }
  if (typeof body.status === "string" && STATUSES.includes(body.status as CommercialItemStatus)) {
    patch.status = body.status as CommercialItemStatus;
  }
  if (typeof body.paid_at === "string" || body.paid_at === null) {
    patch.paid_at = body.paid_at === null ? null : String(body.paid_at);
  }
  if (typeof body.linked_change_order_id === "string" || body.linked_change_order_id === null) {
    patch.linked_change_order_id = body.linked_change_order_id === null ? null : String(body.linked_change_order_id);
  }
  if (typeof body.linked_document_id === "string" || body.linked_document_id === null) {
    patch.linked_document_id = body.linked_document_id === null ? null : String(body.linked_document_id);
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await updateCommercialItem(supabase, ctx, projectId, itemId, patch);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (error === "Not found") return NextResponse.json({ error }, { status: 404 });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ data });
}
