import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  canReadProjects,
} from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { mapPollStatusJobs } from "@/lib/domain/vision-jobs/vision-job-lifecycle";

const PROCESSING_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Lightweight poll endpoint for job status.
 * Internal readers only; never lists job ids or provider errors to portal stakeholders.
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
  if (!canReadProjects(ctx)) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "Insufficient rights" } },
      { status: 403 }
    );
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError === "Insufficient rights") {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: projectError } },
      { status: 403 }
    );
  }
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
    .select("id, media_id, status, error_type, attempt_count, started_at")
    .in("media_id", mediaIds);

  const mapped = mapPollStatusJobs(jobs ?? [], Date.now(), PROCESSING_TIMEOUT_MS);
  return NextResponse.json({
    ok: true,
    data: mapped,
  });
}
