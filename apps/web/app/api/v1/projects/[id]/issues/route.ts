import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { listIssues, createIssue } from "@/lib/domain/issues/issue.service";

export const dynamic = "force-dynamic";

/** GET /api/v1/projects/:id/issues — list project issues. Query: status?. */
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
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status")?.trim() || undefined;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listIssues(supabase, ctx, projectId, { status });
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

/** POST /api/v1/projects/:id/issues — create issue. Body: title, description?, task_id?, milestone_id? */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const input = {
    project_id: projectId,
    title,
    description: typeof body.description === "string" ? body.description : undefined,
    task_id: typeof body.task_id === "string" ? body.task_id : undefined,
    milestone_id: typeof body.milestone_id === "string" ? body.milestone_id : undefined,
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createIssue(supabase, ctx, input);
  if (error && error !== "Project not found") return NextResponse.json({ error }, { status: 403 });
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
