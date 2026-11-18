import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  canReadProjects,
} from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { mapAnalysisJobToLifecycle } from "@/lib/domain/vision-jobs/vision-job-lifecycle";

/**
 * GET /api/v1/projects/:id/jobs/:jobId — poll a single vision/analysis job.
 * Internal readers only. Never reports success unless analysis_jobs.status is completed.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id: projectId, jobId } = await params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    throw e;
  }
  if (!canReadProjects(ctx)) {
    return NextResponse.json({ success: false, error: "Insufficient rights" }, { status: 403 });
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError === "Insufficient rights") {
    return NextResponse.json({ success: false, error: "Insufficient rights" }, { status: 403 });
  }
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const { data: job, error: jobErr } = await supabase
    .from("analysis_jobs")
    .select("id, tenant_id, media_id, status, error_type, attempt_count, started_at, finished_at")
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  if (job.tenant_id !== project.tenant_id) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const { data: media } = await supabase
    .from("media")
    .select("project_id")
    .eq("id", job.media_id as string)
    .maybeSingle();

  if (!media || media.project_id !== projectId) {
    return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
  }

  const lifecycle = mapAnalysisJobToLifecycle({
    status: job.status as string | null,
    error_type: (job.error_type as string | null) ?? null,
    attempts: typeof job.attempt_count === "number" ? job.attempt_count : 0,
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      lifecycle,
      error_type: job.error_type ?? null,
      attempt_count: typeof job.attempt_count === "number" ? job.attempt_count : 0,
      started_at: job.started_at ?? null,
      finished_at: job.finished_at ?? null,
    },
  });
}
