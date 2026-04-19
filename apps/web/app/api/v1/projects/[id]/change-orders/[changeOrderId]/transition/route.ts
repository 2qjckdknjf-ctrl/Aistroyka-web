/**
 * POST /api/v1/projects/:id/change-orders/:changeOrderId/transition
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { transitionChangeOrder } from "@/lib/domain/change-orders/change-orders.service";
import type { ChangeOrderStatus } from "@/lib/domain/change-orders/change-orders.types";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; changeOrderId: string }> }) {
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
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const toStatus = body.to_status as ChangeOrderStatus;
  const note = typeof body.note === "string" ? body.note : null;

  const supabase = await createClientFromRequest(request);
  const { ok, error } = await transitionChangeOrder(supabase, ctx, projectId, changeOrderId, toStatus, note);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error: error || "Transition failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
