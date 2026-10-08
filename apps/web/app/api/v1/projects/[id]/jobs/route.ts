import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  authorize,
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
} from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { createVisionAnalysisJob } from "@/lib/domain/vision-jobs/create-vision-job.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/projects/:id/jobs — create/start an analysis_jobs row (QUEUED).
 * Poll GET /api/v1/projects/:id/jobs/:jobId.
 * Video media is still processed by POST /api/v1/ai/analyze-video-daily until the
 * async worker implements video (runOneJob currently fails video as not implemented).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  if (!authorize(ctx, "analysis:trigger")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const payload = body as { media_id?: string; request_key?: string; priority?: "high" | "normal" | "low" };
  if (!payload.media_id) return NextResponse.json({ error: "media_id required" }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const result = await createVisionAnalysisJob(supabase, {
    tenantId: ctx.tenantId!,
    projectId,
    mediaId: payload.media_id,
    requestKey: payload.request_key ?? request.headers.get("x-idempotency-key"),
    priority: payload.priority,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(
    {
      data: {
        jobId: result.jobId,
        status: result.status,
        lifecycle: result.lifecycle,
        created: result.created,
      },
    },
    { status: 202 }
  );
}
