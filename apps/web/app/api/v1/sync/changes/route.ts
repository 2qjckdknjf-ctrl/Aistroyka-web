import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getChangesAfter } from "@/lib/sync/change-log.repository";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";

/**
 * GET /api/v1/sync/changes?cursor=<n>&limit=<m>
 * Returns deltas after cursor + nextCursor. Requires x-device-id.
 */
export async function GET(request: Request) {
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
  const url = new URL(request.url);
  const cursor = Math.max(0, parseInt(url.searchParams.get("cursor") ?? "0", 10) || 0);
  const limit = Math.min(500, Math.max(1, parseInt(url.searchParams.get("limit") ?? "100", 10) || 100));
  const supabase = await createClient();
  const changes = await getChangesAfter(supabase, ctx.tenantId, cursor, limit);
  const nextCursor = changes.length > 0 ? changes[changes.length - 1].id : cursor;
  return NextResponse.json({
    data: { changes },
    nextCursor,
    serverTime: new Date().toISOString(),
  });
}
