/**
 * GET /api/v1/projects/:id/documents/:documentId — document detail.
 * PATCH /api/v1/projects/:id/documents/:documentId — update document (manager).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  getDocumentById,
  updateDocument,
} from "@/lib/domain/documents/document.service";
import type { ProjectDocumentStatus } from "@/lib/domain/documents/document.types";

export const dynamic = "force-dynamic";

function parseOptionalLinkId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** GET /api/v1/projects/:id/documents/:documentId */
export async function GET(
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
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await getDocumentById(supabase, ctx, documentId, projectId);
  if (error && error !== "Document not found" && error !== "Project not found")
    return NextResponse.json({ error }, { status: 403 });
  if (error === "Document not found" || error === "Project not found")
    return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

/** PATCH /api/v1/projects/:id/documents/:documentId — update document. Body: title?, description?, status?, object_path?, report_id?, task_id?, milestone_id?, decision_comment? */
export async function PATCH(
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

  const validStatuses: ProjectDocumentStatus[] = [
    "draft",
    "uploaded",
    "under_review",
    "approved",
    "rejected",
    "changes_requested",
    "archived",
  ];
  const status =
    typeof body.status === "string" && validStatuses.includes(body.status as ProjectDocumentStatus)
      ? (body.status as ProjectDocumentStatus)
      : undefined;

  const decision_comment =
    body.decision_comment === null
      ? null
      : typeof body.decision_comment === "string"
        ? body.decision_comment
        : undefined;

  const supabase = await createClientFromRequest(request);
  const { data, error } = await updateDocument(supabase, ctx, documentId, projectId, {
    title: typeof body.title === "string" ? body.title : undefined,
    description: typeof body.description === "string" ? body.description : undefined,
    status,
    client_visible: typeof body.client_visible === "boolean" ? body.client_visible : undefined,
    object_path: typeof body.object_path === "string" ? body.object_path : undefined,
    report_id: parseOptionalLinkId(body.report_id),
    task_id: parseOptionalLinkId(body.task_id),
    milestone_id: parseOptionalLinkId(body.milestone_id),
    decision_comment,
  });

  if (error && error !== "Document not found" && error !== "Project not found") {
    if (
      error === "invalid_status_transition" ||
      error === "invalid_object_path_update" ||
      error === "invalid_report_linkage" ||
      error === "invalid_task_linkage" ||
      error === "invalid_milestone_linkage"
    ) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ error }, { status: 403 });
  }
  if (error === "Document not found" || error === "Project not found")
    return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Update failed" }, { status: 500 });
  return NextResponse.json({ data });
}
