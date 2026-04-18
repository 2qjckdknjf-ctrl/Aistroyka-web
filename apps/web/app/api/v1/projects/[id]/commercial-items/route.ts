/**
 * GET/POST /api/v1/projects/:id/commercial-items — Wave 4 Step 21 commercial / billing control.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { createCommercialItem, listCommercialItems } from "@/lib/domain/commercial/commercial.service";
import type { CommercialItemKind } from "@/lib/domain/commercial/commercial.types";

export const dynamic = "force-dynamic";

const KINDS: CommercialItemKind[] = [
  "invoice",
  "expected_revenue",
  "deposit",
  "credit_note",
  "other",
];

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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
  const { data, error } = await listCommercialItems(supabase, ctx, projectId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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

  const kind: CommercialItemKind | null =
    typeof body.kind === "string" && KINDS.includes(body.kind as CommercialItemKind)
      ? (body.kind as CommercialItemKind)
      : null;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  const currency = typeof body.currency === "string" ? body.currency.trim() : undefined;
  const description = typeof body.description === "string" ? body.description : undefined;
  const due_date = typeof body.due_date === "string" ? body.due_date : body.due_date === null ? null : undefined;
  const linked_change_order_id =
    typeof body.linked_change_order_id === "string" ? body.linked_change_order_id : body.linked_change_order_id === null ? null : undefined;
  const linked_document_id =
    typeof body.linked_document_id === "string" ? body.linked_document_id : body.linked_document_id === null ? null : undefined;

  if (!kind || !title || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "kind, title, and amount are required" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createCommercialItem(supabase, ctx, projectId, {
    kind,
    title,
    amount,
    currency,
    description,
    due_date: due_date === undefined ? undefined : due_date,
    linked_change_order_id,
    linked_document_id,
  });

  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (error) return NextResponse.json({ error }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
