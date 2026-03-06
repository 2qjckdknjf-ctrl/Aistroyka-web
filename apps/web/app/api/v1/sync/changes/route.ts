import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getChangesAfter, getMaxCursor, getMinRetainedCursor } from "@/lib/sync/change-log.repository";
import { getCursor } from "@/lib/sync/sync-cursors.repository";
import { syncConflictResponse } from "@/lib/sync/sync-conflict";
import { getOrCreateRequestId, logStructured, withRequestIdAndTiming } from "@/lib/observability";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";
const ROUTE_KEY = "GET /api/v1/sync/changes";

/**
 * GET /api/v1/sync/changes?cursor=<n>&limit=<m>
 * Returns deltas after cursor + nextCursor. Requires x-device-id.
 */
export async function GET(request: Request) {
  const start = Date.now();
  const deviceId = request.headers.get(DEVICE_ID_HEADER)?.trim();
  if (!deviceId) {
    return withRequestIdAndTiming(request, NextResponse.json({ error: "Missing x-device-id header" }, { status: 400 }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start });
  }
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return withRequestIdAndTiming(request, NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start });
    }
    throw e;
  }
  const url = new URL(request.url);
  const cursor = Math.max(0, parseInt(url.searchParams.get("cursor") ?? "0", 10) || 0);
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") ?? "100", 10) || 100));
  const supabase = await createClient();
  const tenantId = ctx.tenantId as string;
  const minRetained = getMinRetainedCursor();
  if (minRetained > 0 && cursor < minRetained) {
    const serverCursor = await getMaxCursor(supabase, tenantId);
    logStructured({ event: "sync_conflict", hint: "retention_window_exceeded", device_id: deviceId, tenant_id: ctx.tenantId, user_id: ctx.userId, request_id: getOrCreateRequestId(request) });
    return withRequestIdAndTiming(request, syncConflictResponse(serverCursor, true, "retention_window_exceeded"), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const serverCursor = await getMaxCursor(supabase, tenantId);
  if (cursor > serverCursor) {
    logStructured({ event: "sync_conflict", hint: "cursor_ahead", device_id: deviceId, tenant_id: ctx.tenantId, user_id: ctx.userId, request_id: getOrCreateRequestId(request) });
    return withRequestIdAndTiming(request, syncConflictResponse(serverCursor), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const storedCursor = await getCursor(supabase, tenantId, ctx.userId as string, deviceId);
  if (storedCursor > 0 && cursor < storedCursor) {
    logStructured({ event: "sync_conflict", hint: "device_mismatch", device_id: deviceId, tenant_id: ctx.tenantId, user_id: ctx.userId, request_id: getOrCreateRequestId(request) });
    return withRequestIdAndTiming(request, syncConflictResponse(serverCursor, false, "device_mismatch"), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
  }
  const changes = await getChangesAfter(supabase, ctx.tenantId, cursor, limit);
  const nextCursor = changes.length > 0 ? changes[changes.length - 1].id : cursor;
  return withRequestIdAndTiming(request, NextResponse.json({
    data: { changes },
    nextCursor,
    serverTime: new Date().toISOString(),
  }), { route: ROUTE_KEY, method: "GET", duration_ms: Date.now() - start, tenantId: ctx.tenantId, userId: ctx.userId });
}
