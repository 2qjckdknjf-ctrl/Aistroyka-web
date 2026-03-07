import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject, hasActiveJobs } from "@/lib/domain/projects/project.service";

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

  // Check for active jobs via service
  const { hasActiveJobs: active, error: jobsError } = await hasActiveJobs(supabase, ctx, projectId);
  if (jobsError) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL_ERROR", message: jobsError } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { hasActiveJobs: active },
  });
}
