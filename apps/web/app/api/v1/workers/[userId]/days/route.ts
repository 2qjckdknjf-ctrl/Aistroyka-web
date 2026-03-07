import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listDaysForUser } from "@/lib/domain/worker-day/worker-day.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/workers/:userId/days — list worker days for a user (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

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
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "31", 10) || 31, 90);

  const supabase = await createClient();
  const { data, error } = await listDaysForUser(supabase, ctx, userId, { from, to, limit });

  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data });
}
