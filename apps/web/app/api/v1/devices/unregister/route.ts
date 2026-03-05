/**
 * POST /api/v1/devices/unregister — remove device token. Body: { device_id }.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
  if (!deviceId) return NextResponse.json({ error: "device_id required" }, { status: 400 });
  const supabase = await createClient();
  const { error } = await supabase
    .from("device_tokens")
    .delete()
    .eq("tenant_id", ctx.tenantId)
    .eq("user_id", ctx.userId)
    .eq("device_id", deviceId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
