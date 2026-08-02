import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { requireProjectOwner, ProjectAccessError } from "@/lib/domain/projects/project-access";
import { performOwnerDecision } from "@/lib/domain/documents/document-decision.service";
import type { OwnerDecisionAction } from "@/lib/domain/documents/document.types";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: OwnerDecisionAction[] = ["approve", "reject", "request_changes"];

/** POST /api/v1/projects/:id/documents/:documentId/decision — owner decision. Project owner (project_members.role=owner) only. */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; documentId: string }> }
) {
  const { id: projectId, documentId } = await context.params;
  if (!projectId || !documentId)
    return NextResponse.json({ error: "Missing project or document id" }, { status: 400 });

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
  try {
    await requireProjectOwner(supabase, ctx, projectId);
  } catch (e) {
    if (e instanceof ProjectAccessError) {
      if (e.code === "forbidden") return NextResponse.json({ error: e.message }, { status: 403 });
      if (e.code === "tenant_required") return NextResponse.json({ error: e.message }, { status: 401 });
      if (e.code === "not_found") return NextResponse.json({ error: e.message }, { status: 404 });
    }
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action =
    typeof body.action === "string" && VALID_ACTIONS.includes(body.action as OwnerDecisionAction)
      ? (body.action as OwnerDecisionAction)
      : null;
  if (!action)
    return NextResponse.json(
      { error: "action required: approve | reject | request_changes" },
      { status: 400 }
    );

  const comment =
    typeof body.comment === "string" ? body.comment : undefined;

  const { data, error } = await performOwnerDecision(
    supabase,
    ctx,
    documentId,
    projectId,
    action,
    comment
  );

  if (error === "Project not found" || error === "Document not found")
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (error === "Document is not pending decision")
    return NextResponse.json({ error }, { status: 400 });
  if (error === "invalid_status_transition")
    return NextResponse.json({ error }, { status: 400 });
  if (error) return NextResponse.json({ error }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });

  return NextResponse.json({ data });
}
