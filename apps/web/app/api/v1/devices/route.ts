import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Allowed device list fields. NEVER include token/fcm_token/apns_token — push tokens must not be exposed to manager cockpit. */
const DEVICE_LIST_COLS = "tenant_id, user_id, device_id, platform, created_at, disabled_at";

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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 200);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const platform = url.searchParams.get("platform") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const q = url.searchParams.get("q")?.trim();

  const supabase = getAdminClient() ?? await createClient();
  let query = supabase
    .from("device_tokens")
    .select(DEVICE_LIST_COLS)
    .eq("tenant_id", ctx.tenantId!)
    .order("created_at", { ascending: false });
  if (platform) query = query.eq("platform", platform);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  const fetchLimit = q ? Math.min(200, limit * 3) : limit;
  const { data: rows, error } = await query.range(offset, offset + fetchLimit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let filtered = rows ?? [];
  if (q) {
    const qLower = q.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r as { device_id: string }).device_id?.toLowerCase().includes(qLower) ||
        (r as { user_id: string }).user_id?.toLowerCase().includes(qLower)
    );
  }

  let countQuery = supabase
    .from("device_tokens")
    .select("device_id", { count: "exact", head: true })
    .eq("tenant_id", ctx.tenantId!);
  if (platform) countQuery = countQuery.eq("platform", platform);
  if (from) countQuery = countQuery.gte("created_at", from);
  if (to) countQuery = countQuery.lte("created_at", to);
  const countRes = await countQuery;
  const total = q ? filtered.length : (countRes.count ?? (rows?.length ?? 0));
  const paginated = q ? filtered.slice(0, limit) : filtered;

  const safeRows = paginated.map((r) => {
    const out: Record<string, unknown> = {
      user_id: (r as { user_id: string }).user_id,
      device_id: (r as { device_id: string }).device_id,
      platform: (r as { platform: string }).platform,
      created_at: (r as { created_at: string }).created_at,
      disabled_at: (r as { disabled_at?: string | null }).disabled_at ?? null,
    };
    ["token", "fcm_token", "apns_token", "push_token"].forEach((key) => {
      if (key in (r as object)) delete out[key];
    });
    return out;
  });
  return NextResponse.json({ data: safeRows, total });
}
