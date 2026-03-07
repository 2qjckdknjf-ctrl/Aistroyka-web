import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getWorkerSummary } from "@/lib/domain/workers/worker-summary.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/workers/:userId/summary — reports count and media count for worker (tenant-scoped). */
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

  const supabase = await createClient();
  const { data, error } = await getWorkerSummary(supabase, ctx, userId);

  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Worker summary not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}
