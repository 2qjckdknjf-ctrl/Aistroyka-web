import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { bootstrap } from "@/lib/sync/sync.service";

export const dynamic = "force-dynamic";

const DEVICE_ID_HEADER = "x-device-id";

/**
 * GET /api/v1/sync/bootstrap
 * Returns initial minimal snapshot (tasks, reports, upload sessions for user) + cursor.
 * Requires x-device-id.
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
  const supabase = await createClient();
  const result = await bootstrap(supabase, ctx as import("@/lib/tenant/tenant.types").TenantContext, {
    deviceId,
  });
  return NextResponse.json(result);
}
