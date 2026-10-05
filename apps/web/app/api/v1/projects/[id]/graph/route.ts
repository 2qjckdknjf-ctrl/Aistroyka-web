import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import { getById as getProjectRow } from "@/lib/domain/projects/project.repository";
import { buildConstructionGraphAIContext } from "@/lib/domain/construction-graph/construction-graph.ai-context";
import { queryProjectConstructionGraph } from "@/lib/domain/construction-graph/construction-graph.repository";

export const dynamic = "force-dynamic";

async function canReadProjectGraph(
  supabase: Awaited<ReturnType<typeof createClientFromRequest>>,
  tenantId: string,
  projectId: string
): Promise<{ ok: boolean; error: string }> {
  const membership = await supabase.rpc("can_read_project_membership", {
    p_tenant_id: tenantId,
    p_project_id: projectId,
  });
  if (membership.error) return { ok: false, error: membership.error.message };
  if (membership.data === true) return { ok: true, error: "" };
  const portal = await supabase.rpc("is_portal_stakeholder_for_project", {
    p_project_id: projectId,
  });
  if (portal.error) return { ok: false, error: portal.error.message };
  return { ok: portal.data === true, error: "" };
}

/** GET /api/v1/projects/:id/graph — overlay query over source-of-truth entities. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const access = await canReadProjectGraph(supabase, ctx.tenantId!, id);
  if (access.error) return NextResponse.json({ error: access.error }, { status: 500 });
  if (!access.ok) return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });

  // Existence check only. Workspace vs portal authorization already ran above;
  // getProject() would 403 stakeholders via canReadProjects (viewer+).
  const project = await getProjectRow(supabase, id, ctx.tenantId!);
  if (!project) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { graph, error } = await queryProjectConstructionGraph(supabase, ctx.tenantId!, id);
  if (error && error !== "Not found") return NextResponse.json({ error }, { status: 500 });
  if (!graph) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const view = new URL(request.url).searchParams.get("view");
  if (view === "ai_context") {
    return NextResponse.json({ data: buildConstructionGraphAIContext(graph) });
  }
  return NextResponse.json({ data: graph });
}
