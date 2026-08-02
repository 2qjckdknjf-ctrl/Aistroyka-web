/**
 * GET /api/v1/projects/:id/documents — list project documents (tenant-scoped).
 * POST /api/v1/projects/:id/documents — create document (manager).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import {
  listDocuments,
  createDocument,
} from "@/lib/domain/documents/document.service";
import type { ProjectDocumentType } from "@/lib/domain/documents/document.types";

export const dynamic = "force-dynamic";

function parseOptionalLinkId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** GET /api/v1/projects/:id/documents — list project documents. */
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

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listDocuments(supabase, ctx, projectId);
  if (error && error !== "Project not found") {
    if (error === "status must be draft on create") {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ error }, { status: 403 });
  }
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  return NextResponse.json({ data });
}

/** POST /api/v1/projects/:id/documents — create document. Body: type, title, description?, status?, report_id?, task_id?, milestone_id? */
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

  const type = typeof body.type === "string" ? body.type : "";
  const validTypes: ProjectDocumentType[] = ["document", "act", "contract"];
  if (!validTypes.includes(type as ProjectDocumentType))
    return NextResponse.json({ error: "type required: document | act | contract" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createDocument(supabase, ctx, {
    project_id: projectId,
    type: type as ProjectDocumentType,
    title,
    description: typeof body.description === "string" ? body.description : undefined,
    status:
      typeof body.status === "string" && ["draft", "uploaded", "under_review", "approved", "rejected", "archived"].includes(body.status)
        ? (body.status as "draft" | "uploaded" | "under_review" | "approved" | "rejected" | "archived")
        : undefined,
    report_id: parseOptionalLinkId(body.report_id),
    task_id: parseOptionalLinkId(body.task_id),
    milestone_id: parseOptionalLinkId(body.milestone_id),
  });

  if (error && error !== "Project not found") {
    if (
      error === "invalid_report_linkage" ||
      error === "invalid_task_linkage" ||
      error === "invalid_milestone_linkage" ||
      error === "status must be draft on create"
    ) {
      return NextResponse.json({ error }, { status: 400 });
    }
    return NextResponse.json({ error }, { status: 403 });
  }
  if (error === "Project not found") return NextResponse.json({ error }, { status: 404 });
  if (!data) return NextResponse.json({ error: "Create failed" }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
