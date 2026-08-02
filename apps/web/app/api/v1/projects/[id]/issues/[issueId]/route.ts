import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { getIssueById, updateIssue } from "@/lib/domain/issues/issue.service";
import type { IssueStatus, UpdateIssueInput } from "@/lib/domain/issues/issue.types";

export const dynamic = "force-dynamic";

const VALID_STATUSES: IssueStatus[] = ["open", "in_review", "resolved", "closed"];

/** GET /api/v1/projects/:id/issues/:issueId — get single issue. */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; issueId: string }> }
) {
  const { id: projectId, issueId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  if (!issueId) return NextResponse.json({ error: "Missing issue id" }, { status: 400 });

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

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getIssueById(supabase, ctx, issueId);
  if (error) return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (data.project_id !== projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

/** PATCH /api/v1/projects/:id/issues/:issueId — update issue. Body: title?, description?, status?, task_id?, milestone_id? */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; issueId: string }> }
) {
  const { id: projectId, issueId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  if (!issueId) return NextResponse.json({ error: "Missing issue id" }, { status: 400 });

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

  const input: UpdateIssueInput = {};
  if (typeof body.title === "string") input.title = body.title.trim();
  if (typeof body.description === "string") input.description = body.description;
  if (typeof body.task_id === "string") input.task_id = body.task_id || null;
  if (typeof body.milestone_id === "string") input.milestone_id = body.milestone_id || null;
  if (typeof body.status === "string" && VALID_STATUSES.includes(body.status as IssueStatus)) {
    input.status = body.status as IssueStatus;
  }

  const supabase = await createClientFromRequest(request);
  if (Object.keys(input).length === 0) {
    const { data } = await getIssueById(supabase, ctx, issueId);
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (data.project_id !== projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data });
  }

  const { data, error } = await updateIssue(supabase, ctx, issueId, input);
  if (error) return NextResponse.json({ error }, { status: error === "Not found" ? 404 : 403 });
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  if (data.project_id !== projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
