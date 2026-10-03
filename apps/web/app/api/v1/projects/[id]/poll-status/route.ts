import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getProjectById } from "@/lib/supabase/rpc";
import { mapAnalysisJobToLifecycle } from "@/lib/domain/vision-jobs/vision-job-lifecycle";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Lightweight poll endpoint for job status.
 * Returns hasActiveJobs (excluding UI-timeout jobs) so client can retry on failure.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  const { data: project } = await getProjectById(supabase, projectId);
  if (!project) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Project not found" } },
      { status: 404 }
    );
  }

  const { data: mediaRows } = await supabase
    .from("media")
    .select("id")
    .eq("project_id", projectId);
  const mediaIds = (mediaRows ?? []).map((m) => m.id);
  if (mediaIds.length === 0) {
    return NextResponse.json({ ok: true, data: { hasActiveJobs: false, jobs: [] } });
  }

  const { data: jobs } = await supabase
    .from("analysis_jobs")
    .select("id, media_id, status, error_type, started_at")
    .in("media_id", mediaIds);

  const now = Date.now();
  const hasActiveJobs = (jobs ?? []).some((j) => {
    const s = j.status;
    if (s !== "pending" && s !== "queued" && s !== "processing") return false;
    if (s === "processing") {
      const started = new Date(j.started_at).getTime();
      if (now - started > PROCESSING_TIMEOUT_MS) return false;
    }
    return true;
  });

  return NextResponse.json({
    ok: true,
    data: {
      hasActiveJobs,
      jobs: (jobs ?? []).map((j) => ({
        jobId: j.id,
        status: j.status,
        lifecycle: mapAnalysisJobToLifecycle({
          status: j.status as string | null,
          error_type: (j.error_type as string | null) ?? null,
        }),
      })),
    },
  });
}
