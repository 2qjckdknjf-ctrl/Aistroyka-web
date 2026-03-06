import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { requireAdmin } from "@/lib/api/require-admin";
import { listPushOutbox } from "@/lib/platform/push/push-outbox.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/push/outbox — list push outbox (admin only, tenant-scoped, paginated). */
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
  const adminErr = requireAdmin(ctx, "read");
  if (adminErr) return adminErr;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const supabase = await createClient();
  const { rows, total } = await listPushOutbox(supabase, ctx.tenantId!, { status, from, to, limit, offset });
  return NextResponse.json({ data: rows, total });
}
