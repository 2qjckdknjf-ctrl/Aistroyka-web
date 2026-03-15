/**
 * POST /api/v1/devices/register — register device token for push. Body: { device_id, platform: ios|android, token }.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { DeviceRegisterRequestSchema } from "@aistroyka/contracts";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = DeviceRegisterRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid request body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const { device_id: deviceId, platform, token } = parsed.data;
  const admin = getAdminClient();
  if (!admin) return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  const row = {
    tenant_id: ctx.tenantId,
    user_id: ctx.userId,
    device_id: deviceId.trim(),
    platform,
    token: token.trim(),
  };
  const { error } = await (admin as any).from("device_tokens").upsert(row, {
    onConflict: "tenant_id,user_id,device_id",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
