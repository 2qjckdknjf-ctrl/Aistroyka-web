import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { getProjectById } from "@/lib/supabase/rpc";
import { hasMinRole } from "@/lib/auth/tenant";
import { triggerAnalysisJobRpc } from "@/lib/api/rpcClient";

/**
 * Re-queue an existing analysis job by id (RPC trigger_analysis via service role).
 * Caller must be a member+ of the job's tenant; job must belong to the given project.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; jobId: string }> }
) {
  const { id: projectId, jobId } = await params;
  const supabase = await createClient();

  const { data: project } = await getProjectById(supabase, projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const canTrigger = await hasMinRole(supabase, project.tenant_id, "member");
  if (!canTrigger) {
    return NextResponse.json(
      { success: false, error: "Insufficient rights: only member and above can run analysis" },
      { status: 403 }
    );
  }

  const { data: job, error: jobErr } = await supabase
    .from("analysis_jobs")
    .select("id, tenant_id, media_id")
    .eq("id", jobId)
    .maybeSingle();

  if (jobErr || !job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  if (job.tenant_id !== project.tenant_id) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  const { data: media } = await supabase
    .from("media")
    .select("project_id")
    .eq("id", job.media_id as string)
    .maybeSingle();

  if (!media || media.project_id !== projectId) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Re-queue requires SUPABASE_SERVICE_ROLE_KEY (server-only). Set in env and redeploy.",
      },
      { status: 503 }
    );
  }

  try {
    const row = await triggerAnalysisJobRpc(admin, { p_job_id: jobId });
    return NextResponse.json({
      success: true,
      data: { jobId: row.id, status: row.status },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to trigger analysis";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
