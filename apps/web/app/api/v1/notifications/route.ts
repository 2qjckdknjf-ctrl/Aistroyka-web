import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError } from "@/lib/tenant";
import { listForUser } from "@/lib/domain/notifications/manager-notifications.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/notifications — manager inbox (tenant-scoped, for current user). Query: limit, offset. */
export async function GET(request: Request) {
  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!ctx.tenantId || !ctx.userId) {
    return NextResponse.json({ error: "Tenant and user required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const supabase = await createClientFromRequest(request);
  const { data, total } = await listForUser(supabase, ctx.tenantId, ctx.userId, { limit, offset });

  return NextResponse.json({
    data: data.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body ?? undefined,
      created_at: row.created_at,
      read_at: row.read_at ?? undefined,
      target_type: row.target_type ?? undefined,
      target_id: row.target_id ?? undefined,
    })),
    total,
  });
}
