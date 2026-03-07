import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getWorkerSyncDelta } from "@/lib/domain/sync/worker-sync.service";
import { getOrCreateTraceId } from "@/lib/observability";

export const dynamic = "force-dynamic";

/**
 * Lightweight sync for mobile: tasks, report statuses, upload session statuses since timestamp.
 * Returns delta items. Pagination token optional for Phase 2.
 */
export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }

  const traceId = getOrCreateTraceId(request);
  const serverTime = new Date().toISOString();
  const url = new URL(request.url);
  const since = url.searchParams.get("since") ?? undefined;

  const supabase = await createClient();
  const { data, error } = await getWorkerSyncDelta(supabase, ctx, since);

  if (error) {
    const status = error === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({
    serverTime,
    traceId,
    data,
    pagination: null,
  });
}
