/**
 * POST /api/v1/devices/register — register device token for push. Body: { device_id, platform: ios|android, token }.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const body = await request.json().catch(() => ({}));
  const deviceId = typeof body.device_id === "string" ? body.device_id.trim() : "";
  const platform = body.platform === "ios" || body.platform === "android" ? body.platform : "";
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!deviceId || !platform || !token) {
    return NextResponse.json({ error: "device_id, platform (ios|android), and token required" }, { status: 400 });
  }
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const { error } = await admin.from("device_tokens").upsert(
    {
      tenant_id: ctx.tenantId,
      user_id: ctx.userId,
      device_id: deviceId,
      platform,
      token,
    },
    { onConflict: "tenant_id,user_id,device_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
