import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProject } from "@/lib/domain/projects/project.service";
import { listProjectUploads } from "@/lib/domain/projects/project-scoped.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/uploads — list upload sessions linked to project (via report media). Paginated. */
export async function GET(
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

  const supabase = await createClient();
  const { data: project, error: projectError } = await getProject(supabase, ctx, projectId);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 100);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0", 10) || 0);

  const { rows, total } = await listProjectUploads(supabase, ctx.tenantId!, projectId, {
    limit,
    offset,
  });
  return NextResponse.json({ data: rows, total });
}
