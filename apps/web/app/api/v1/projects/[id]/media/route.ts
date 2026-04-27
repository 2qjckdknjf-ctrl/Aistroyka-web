import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getProjectForInternalWorkspace } from "@/lib/domain/projects/project.service";
import { listByProject } from "@/lib/domain/media/media.repository";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/media — list recent project media (photos). Tenant-scoped, read-only. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data: project, error: projectError } = await getProjectForInternalWorkspace(supabase, ctx, projectId);
  if (projectError || !project) {
    const status = projectError === "Insufficient rights" ? 403 : 404;
    return NextResponse.json({ error: projectError ?? "Not found" }, { status });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "12", 10) || 12, 50);
  const data = await listByProject(supabase, projectId, ctx.tenantId!, { limit });
  return NextResponse.json({ data });
}
