import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { upsertCursor } from "@/lib/sync/sync-cursors.repository";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";

/**
 * POST /api/v1/sync/ack
 * Body: { cursor: number }. Stores device cursor for this tenant/user/device. Requires x-device-id.
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
  let body: { cursor?: number } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const cursor = typeof body.cursor === "number" && body.cursor >= 0 ? Math.floor(body.cursor) : 0;
  const supabase = await createClient();
  const ok = await upsertCursor(supabase, ctx.tenantId, ctx.userId, deviceId, cursor);
  if (!ok) return NextResponse.json({ error: "Failed to store cursor" }, { status: 500 });
  return NextResponse.json({ ok: true, cursor, serverTime: new Date().toISOString() });
}
