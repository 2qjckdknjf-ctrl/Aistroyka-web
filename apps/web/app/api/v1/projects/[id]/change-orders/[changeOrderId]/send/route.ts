/**
 * POST /api/v1/projects/:id/change-orders/:changeOrderId/send
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { transitionChangeOrder } from "@/lib/domain/change-orders/change-orders.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; changeOrderId: string }> }
) {
  const { id: projectId, changeOrderId } = await context.params;
  if (!projectId || !changeOrderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const supabase = await createClientFromRequest(request);
  const { ok, error } = await transitionChangeOrder(supabase, ctx, projectId, changeOrderId, "proposed", null);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error: error || "Send failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
