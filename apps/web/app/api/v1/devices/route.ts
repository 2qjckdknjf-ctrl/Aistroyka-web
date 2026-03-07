import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listDevices } from "@/lib/domain/devices/device.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/devices — list devices for tenant (cockpit). Push token is never selected or returned. */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id") ?? undefined;

  const supabase = await createClient();
  const { data, error } = await listDevices(supabase, ctx, userId);
  
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  // Filter out sensitive token fields (security: never expose push tokens)
  const safeRows = data.map((r) => {
    const out: Record<string, unknown> = {
      user_id: r.user_id,
      device_id: r.device_id,
      platform: r.platform,
      created_at: r.created_at,
      last_seen: r.last_seen ?? null,
    };
    return out;
  });

  return NextResponse.json({ data: safeRows, total: safeRows.length });
}
