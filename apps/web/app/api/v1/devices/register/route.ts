/**
 * POST /api/v1/devices/register — register device token for push. Body: { device_id, platform: ios|android, token }.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { registerDevice } from "@/lib/domain/devices/device.service";

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
  
  const supabase = await createClient();
  const result = await registerDevice(supabase, ctx, deviceId, platform, token);
  
  if (!result.success) {
    const status = result.error === "Unauthorized" ? 401 : result.error?.includes("required") ? 400 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  
  return NextResponse.json({ success: true });
}
