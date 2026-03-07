import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getAIRequest } from "@/lib/platform/ai/ai-request.service";
import * as jobRepo from "@/lib/platform/jobs/job.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/ai/requests/:id — single AI job detail (tenant-scoped). */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const { data: aiRequest, error } = await getAIRequest(supabase, ctx, id);

  if (error) {
    const status = error === "Unauthorized" ? 401 : error === "Not found" || error === "Not an AI request" ? 404 : 500;
    return NextResponse.json({ error }, { status });
  }

  if (!aiRequest) {
    return NextResponse.json({ error: "AI request not found" }, { status: 404 });
  }

  // Get full job details for response
  const job = await jobRepo.getById(supabase, id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: job.id,
      type: job.type,
      status: job.status,
      payload: job.payload,
      attempts: job.attempts,
      max_attempts: job.max_attempts,
      last_error: job.last_error ?? null,
      last_error_type: job.last_error_type ?? null,
      trace_id: job.trace_id ?? null,
      created_at: job.created_at,
      updated_at: job.updated_at,
    },
  });
}
