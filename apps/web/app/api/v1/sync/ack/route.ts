import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { upsertCursor } from "@/lib/sync/sync-cursors.repository";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";
const ROUTE_KEY = "POST /api/v1/sync/ack";

/**
 * POST /api/v1/sync/ack
 * Body: { cursor: number }. Stores device cursor for this tenant/user/device.
 * Requires x-device-id header. Lite clients must send x-idempotency-key.
 */
export async function POST(request: Request) {
  const deviceId = request.headers.get(DEVICE_ID_HEADER)?.trim();
  if (!deviceId) {
    return NextResponse.json({ error: "Missing x-device-id header" }, { status: 400 });
  }
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return guard.response;
  let body: { cursor?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cursor = typeof body?.cursor === "number" ? Math.max(0, Math.floor(body.cursor)) : 0;
  const supabase = await createClient();
  const ok = await upsertCursor(supabase, ctx.tenantId as string, ctx.userId as string, deviceId, cursor);
  if (!ok) return NextResponse.json({ error: "Failed to store cursor" }, { status: 500 });
  const response = { ok: true, cursor, serverTime: new Date().toISOString() };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return NextResponse.json(response);
}
