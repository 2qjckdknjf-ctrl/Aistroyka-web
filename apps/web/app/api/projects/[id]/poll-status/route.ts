import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { listJobsByProject } from "@/lib/platform/jobs/job.repository";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Lightweight poll endpoint for job status.
 * Returns hasActiveJobs (excluding UI-timeout jobs) so client can retry on failure.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: e.message } },
        { status: 401 }
      );
    }
    throw e;
  }

  const supabase = await createClient();
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError || !project) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: projectError ?? "Project not found" } },
      { status: projectError === "Insufficient rights" ? 403 : 404 }
    );
  }

  // Check for active AI analysis jobs for this project
  const jobs = await listJobsByProject(supabase, ctx.tenantId!, projectId);
  const now = Date.now();
  const activeJobs = jobs.filter((j) => {
    if (j.status !== "queued" && j.status !== "running") return false;
    // Check timeout for running jobs
    if (j.status === "running" && j.started_at) {
      const started = new Date(j.started_at).getTime();
      if (now - started > PROCESSING_TIMEOUT_MS) return false;
    }
    // Filter by project_id in payload
    const payload = j.payload as { project_id?: string } | undefined;
    return payload?.project_id === projectId;
  });

  return NextResponse.json({
    ok: true,
    data: { hasActiveJobs: activeJobs.length > 0 },
  });
}
