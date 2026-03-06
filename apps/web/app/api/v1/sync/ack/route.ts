import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getCursor, upsertCursor } from "@/lib/sync/sync-cursors.repository";
import { getMaxCursor, getMinRetainedCursor } from "@/lib/sync/change-log.repository";
import { syncConflictResponse } from "@/lib/sync/sync-conflict";
import { requireLiteIdempotency, storeLiteIdempotency } from "@/lib/api/lite-idempotency";
import { withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";
const ROUTE_KEY = "POST /api/v1/sync/ack";

/**
 * POST /api/v1/sync/ack
 * Body: { cursor: number }. Stores device cursor for this tenant/user/device.
 * Requires x-device-id header. Lite clients must send x-idempotency-key.
 */
export async function POST(request: Request) {
  const start = Date.now();
  const deviceId = request.headers.get(DEVICE_ID_HEADER)?.trim();
  if (!deviceId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Missing x-device-id header" }, { status: 400 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
  }
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start });
    }
    throw e;
  }
  const guard = await requireLiteIdempotency(request, ctx, ROUTE_KEY);
  if (!guard.ok) return withRequestIdAndTiming(request, guard.response, { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  let body: { cursor?: number };
  try {
    body = await request.json();
  } catch {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Invalid JSON" }, { status: 400 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const cursor = typeof body?.cursor === "number" ? Math.max(0, Math.floor(body.cursor)) : 0;
  const supabase = await createClient();
  const tenantId = ctx.tenantId as string;
  const minRetained = getMinRetainedCursor();
  if (minRetained > 0 && cursor < minRetained) {
    const serverCursor = await getMaxCursor(supabase, tenantId);
    return withRequestIdAndTiming(request, syncConflictResponse(serverCursor, true, "retention_window_exceeded"), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const serverCursor = await getMaxCursor(supabase, tenantId);
  if (cursor > serverCursor) {
    return withRequestIdAndTiming(request, syncConflictResponse(serverCursor), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const storedCursor = await getCursor(supabase, tenantId, ctx.userId as string, deviceId);
  if (storedCursor > 0 && cursor < storedCursor) {
    return withRequestIdAndTiming(request, syncConflictResponse(serverCursor, false, "device_mismatch"), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const ok = await upsertCursor(supabase, tenantId, ctx.userId as string, deviceId, cursor);
  if (!ok) return withRequestIdAndTiming(request, NextResponse.json({ error: "Failed to store cursor" }, { status: 500 }), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  const response = { ok: true, cursor, serverTime: new Date().toISOString() };
  await storeLiteIdempotency(request, ctx, ROUTE_KEY, response, 200);
  return withRequestIdAndTiming(request, NextResponse.json(response), { route: ROUTE_KEY, method: "POST", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
