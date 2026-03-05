/**
 * POST /api/v1/admin/push/test — enqueue a test push (admin). Body: { user_id, platform, type }.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { enqueuePush } from "@/lib/platform/push/push.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  if (!authorize(ctx, "admin:read")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.user_id === "string" ? body.user_id : ctx.userId;
  const platform = body.platform === "ios" || body.platform === "android" ? body.platform : "ios";
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const id = await enqueuePush(admin, {
    tenantId: ctx.tenantId,
    userId,
    platform,
    type: "job_done",
    payload: { test: true },
  });
  if (!id) return NextResponse.json({ error: "Failed to enqueue" }, { status: 500 });
  return NextResponse.json({ success: true, outbox_id: id });
}
