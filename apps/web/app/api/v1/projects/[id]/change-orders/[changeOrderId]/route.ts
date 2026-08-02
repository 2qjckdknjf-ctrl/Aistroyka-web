/**
 * GET/PATCH /api/v1/projects/:id/change-orders/:changeOrderId
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { getChangeOrderDetail, updateChangeOrderContent } from "@/lib/domain/change-orders/change-orders.service";
import { canManageChangeOrders } from "@/lib/domain/change-orders/change-orders.policy";
import type { ChangeOrderKind } from "@/lib/domain/change-orders/change-orders.types";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string; changeOrderId: string }> }) {
  const { id: projectId, changeOrderId } = await context.params;
  if (!projectId || !changeOrderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getChangeOrderDetail(supabase, ctx, projectId, changeOrderId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });

  const isManager = await canManageChangeOrders(supabase, ctx, projectId);
  const payload = { data, audience: isManager ? "manager" : "stakeholder" };
  if (!isManager) {
    return jsonWithCustomerFinanceGuard("GET /api/v1/projects/:id/change-orders/:changeOrderId", payload);
  }
  return NextResponse.json(payload);
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; changeOrderId: string }> }) {
  const { id: projectId, changeOrderId } = await context.params;
  if (!projectId || !changeOrderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const numOrNull = (v: unknown): number | null | undefined => {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const supabase = await createClientFromRequest(request);
  const { ok, error } = await updateChangeOrderContent(supabase, ctx, projectId, changeOrderId, {
    title: typeof body.title === "string" ? body.title : undefined,
    description: body.description === undefined ? undefined : typeof body.description === "string" ? body.description : null,
    reason: body.reason === undefined ? undefined : typeof body.reason === "string" ? body.reason : null,
    kind: body.kind as ChangeOrderKind | undefined,
    schedule_impact_level: body.schedule_impact_level as never,
    budget_impact_level: body.budget_impact_level as never,
    schedule_impact_summary:
      body.schedule_impact_summary === undefined
        ? undefined
        : typeof body.schedule_impact_summary === "string"
          ? body.schedule_impact_summary
          : null,
    budget_impact_summary:
      body.budget_impact_summary === undefined
        ? undefined
        : typeof body.budget_impact_summary === "string"
          ? body.budget_impact_summary
          : null,
    schedule_delta_days: numOrNull(body.schedule_delta_days),
    budget_delta_amount: numOrNull(body.budget_delta_amount),
    customer_amount_delta: numOrNull(body.customer_amount_delta),
    currency: body.currency === undefined ? undefined : typeof body.currency === "string" ? body.currency : "RUB",
    linked_discussion_id:
      body.linked_discussion_id === undefined
        ? undefined
        : typeof body.linked_discussion_id === "string"
          ? body.linked_discussion_id
          : null,
    linked_document_id:
      body.linked_document_id === undefined
        ? undefined
        : typeof body.linked_document_id === "string"
          ? body.linked_document_id
          : null,
    linked_request_id:
      body.linked_request_id === undefined
        ? undefined
        : typeof body.linked_request_id === "string"
          ? body.linked_request_id
          : null,
    linked_milestone_id:
      body.linked_milestone_id === undefined
        ? undefined
        : typeof body.linked_milestone_id === "string"
          ? body.linked_milestone_id
          : null,
    linked_customer_estimate_id:
      body.linked_customer_estimate_id === undefined
        ? undefined
        : typeof body.linked_customer_estimate_id === "string"
          ? body.linked_customer_estimate_id
          : null,
    internal_cost_item_id:
      body.internal_cost_item_id === undefined
        ? undefined
        : typeof body.internal_cost_item_id === "string"
          ? body.internal_cost_item_id
          : null,
  });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error: error || "Update failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
