import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/rpc";
import { mapAnalysisJobToLifecycle } from "@/lib/domain/vision-jobs/vision-job-lifecycle";

/**
 * GET /api/v1/projects/:id/jobs/:jobId — poll a single vision/analysis job.
 * Never reports success unless analysis_jobs.status is completed.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id: projectId, jobId } = await params;
  const supabase = await createClient();

  const { data: project } = await getProjectById(supabase, projectId);
  if (!project) {
    return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
  }

  const { data: job, error: jobErr } = await supabase
    .from("analysis_jobs")
    .select("id, tenant_id, media_id, status, error_type, error_message, started_at, finished_at")
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
  });

  return NextResponse.json({
    success: true,
    data: {
      jobId: job.id,
      status: job.status,
      lifecycle,
      error_type: job.error_type ?? null,
      error_message: job.error_message ?? null,
      started_at: job.started_at ?? null,
      finished_at: job.finished_at ?? null,
    },
  });
}
