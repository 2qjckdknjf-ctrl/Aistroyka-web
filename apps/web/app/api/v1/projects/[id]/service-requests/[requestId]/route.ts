/**
 * GET/PATCH /api/v1/projects/:id/service-requests/:requestId
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { getServiceRequestDetail, patchServiceRequestManager } from "@/lib/domain/aftercare/aftercare.service";
import { canManageAftercareRequests } from "@/lib/domain/aftercare/aftercare.policy";
import type { ServiceRequestCoverageType } from "@/lib/domain/aftercare/aftercare.types";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string; requestId: string }> }) {
  const { id: projectId, requestId } = await context.params;
  if (!projectId || !requestId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const { data, error } = await getServiceRequestDetail(supabase, ctx, projectId, requestId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });

  const isManager = await canManageAftercareRequests(supabase, ctx, projectId);
  return NextResponse.json({ data, audience: isManager ? "manager" : "stakeholder" });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string; requestId: string }> }) {
  const { id: projectId, requestId } = await context.params;
  if (!projectId || !requestId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const { ok, error } = await patchServiceRequestManager(supabase, ctx, projectId, requestId, {
    title: typeof body.title === "string" ? body.title : undefined,
    description: body.description === undefined ? undefined : typeof body.description === "string" ? body.description : null,
    coverage_type: body.coverage_type === undefined ? undefined : (body.coverage_type as ServiceRequestCoverageType),
    assigned_to: body.assigned_to === undefined ? undefined : typeof body.assigned_to === "string" ? body.assigned_to : null,
    due_date: body.due_date === undefined ? undefined : typeof body.due_date === "string" ? body.due_date : null,
    linked_handover_id:
      body.linked_handover_id === undefined ? undefined : typeof body.linked_handover_id === "string" ? body.linked_handover_id : null,
    linked_defect_id:
      body.linked_defect_id === undefined ? undefined : typeof body.linked_defect_id === "string" ? body.linked_defect_id : null,
    linked_discussion_id:
      body.linked_discussion_id === undefined ? undefined : typeof body.linked_discussion_id === "string" ? body.linked_discussion_id : null,
  });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!ok) return NextResponse.json({ error: error || "Update failed" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
