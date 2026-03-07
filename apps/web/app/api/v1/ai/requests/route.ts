import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { listAIRequests } from "@/lib/platform/ai/ai-request.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/ai/requests — list AI jobs (tenant-scoped, paginated). */
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
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);
  const status = url.searchParams.get("status") ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const q = url.searchParams.get("q")?.trim();

  const supabase = await createClient();
  const { data, total, error } = await listAIRequests(supabase, ctx, {
    status,
    from,
    to,
    q,
    limit,
    offset,
  });

  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data, total });
}
