import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { getById } from "@/lib/platform/jobs/job.repository";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/exports/:id/status
 * Returns export job status (queued, running, success, failed, dead).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "admin:read")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }
  const supabase = await createClient();
  const job = await getById(supabase, id);
  if (!job || job.tenant_id !== ctx.tenantId || job.type !== "export") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    data: {
      job_id: job.id,
      status: job.status,
      created_at: job.created_at,
      updated_at: job.updated_at,
      last_error: job.last_error,
    },
  });
}
