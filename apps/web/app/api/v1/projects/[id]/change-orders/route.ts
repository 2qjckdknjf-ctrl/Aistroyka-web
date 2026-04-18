/**
 * GET/POST /api/v1/projects/:id/change-orders
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { createChangeOrder, listChangeOrders } from "@/lib/domain/change-orders/change-orders.service";
import type { ChangeOrderKind, ChangeOrderStatus } from "@/lib/domain/change-orders/change-orders.types";

export const dynamic = "force-dynamic";

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
  const { data, error } = await listChangeOrders(supabase, ctx, projectId);
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
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const numOrNull = (v: unknown): number | null => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createChangeOrder(supabase, ctx, projectId, {
    kind: body.kind as ChangeOrderKind,
    title: typeof body.title === "string" ? body.title : "",
    description: typeof body.description === "string" ? body.description : null,
    initial_status: body.initial_status as ChangeOrderStatus | undefined,
    schedule_impact_level: body.schedule_impact_level as never,
    budget_impact_level: body.budget_impact_level as never,
    schedule_impact_summary: typeof body.schedule_impact_summary === "string" ? body.schedule_impact_summary : null,
    budget_impact_summary: typeof body.budget_impact_summary === "string" ? body.budget_impact_summary : null,
    schedule_delta_days: numOrNull(body.schedule_delta_days),
    budget_delta_amount: numOrNull(body.budget_delta_amount),
    linked_discussion_id: typeof body.linked_discussion_id === "string" ? body.linked_discussion_id : null,
    linked_document_id: typeof body.linked_document_id === "string" ? body.linked_document_id : null,
    linked_request_id: typeof body.linked_request_id === "string" ? body.linked_request_id : null,
    linked_milestone_id: typeof body.linked_milestone_id === "string" ? body.linked_milestone_id : null,
  });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
  return NextResponse.json({ data });
}
