/**
 * POST /api/v1/devices/register — register device token for push. Body: { device_id, platform: ios|android, token }.
 */

import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { DeviceRegisterRequestSchema } from "@aistroyka/contracts";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const ROUTE_KEY = "POST /api/v1/devices/register";

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
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
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return guard.response;
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
  const body = { success: true };
  const idemStore = await storeLiteIdempotency(request, ctx, ROUTE_KEY, body, 200);
  if (!idemStore.ok) return idemStore.response;
  return NextResponse.json(body);
}
