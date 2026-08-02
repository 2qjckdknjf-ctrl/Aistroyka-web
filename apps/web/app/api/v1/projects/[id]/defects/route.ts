/**
 * GET/POST /api/v1/projects/:id/defects
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import {
  createDefectManager,
  createDefectStakeholder,
  listDefects,
} from "@/lib/domain/defects/defects.service";
import { canManageDefects, canReportDefectAsStakeholder } from "@/lib/domain/defects/defects.policy";
import type { DefectStatus } from "@/lib/domain/defects/defects.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await listDefects(supabase, ctx, projectId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data: data ?? [] });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof LitePathForbiddenError) {
      return NextResponse.json(
        { error: "forbidden", code: "lite_client_path_forbidden" },
        { status: 403 }
      );
    }
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);

  if (await canManageDefects(supabase, ctx, projectId)) {
    const { data, error } = await createDefectManager(supabase, ctx, projectId, {
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : null,
      is_blocking: typeof body.is_blocking === "boolean" ? body.is_blocking : undefined,
      assigned_to: typeof body.assigned_to === "string" ? body.assigned_to : null,
      due_date: typeof body.due_date === "string" ? body.due_date : null,
      linked_milestone_id: typeof body.linked_milestone_id === "string" ? body.linked_milestone_id : null,
      linked_document_id: typeof body.linked_document_id === "string" ? body.linked_document_id : null,
      linked_discussion_id: typeof body.linked_discussion_id === "string" ? body.linked_discussion_id : null,
      linked_request_id: typeof body.linked_request_id === "string" ? body.linked_request_id : null,
      initial_status: body.initial_status as DefectStatus | undefined,
    });
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
    return NextResponse.json({ data });
  }

  if (await canReportDefectAsStakeholder(supabase, ctx, projectId)) {
    const { data, error } = await createDefectStakeholder(supabase, ctx, projectId, {
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : null,
      is_blocking: typeof body.is_blocking === "boolean" ? body.is_blocking : undefined,
    });
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
}
