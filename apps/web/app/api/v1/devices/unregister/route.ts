/**
 * POST /api/v1/devices/unregister — remove device token. Body: { device_id }.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { DeviceUnregisterRequestSchema } from "@aistroyka/contracts";

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
  const parsed = DeviceUnregisterRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    const msg = parsed.error.flatten().formErrors[0] ?? parsed.error.flatten().fieldErrors.device_id?.[0] ?? "device_id required";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  const deviceId = parsed.data.device_id;
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
