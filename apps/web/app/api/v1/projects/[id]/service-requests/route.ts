/**
 * GET/POST /api/v1/projects/:id/service-requests — post-handover warranty / aftercare.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import {
  createServiceRequestManager,
  createServiceRequestStakeholder,
  listServiceRequests,
} from "@/lib/domain/aftercare/aftercare.service";
import {
  canManageAftercareRequests,
  canReportAftercareAsStakeholder,
} from "@/lib/domain/aftercare/aftercare.policy";
import type { ServiceRequestCoverageType, ServiceRequestStatus } from "@/lib/domain/aftercare/aftercare.types";

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
  const { data, error } = await listServiceRequests(supabase, ctx, projectId);
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

  if (await canManageAftercareRequests(supabase, ctx, projectId)) {
    const { data, error } = await createServiceRequestManager(supabase, ctx, projectId, {
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : null,
      coverage_type: body.coverage_type as ServiceRequestCoverageType | undefined,
      assigned_to: typeof body.assigned_to === "string" ? body.assigned_to : null,
      due_date: typeof body.due_date === "string" ? body.due_date : null,
      linked_defect_id: typeof body.linked_defect_id === "string" ? body.linked_defect_id : null,
      linked_discussion_id: typeof body.linked_discussion_id === "string" ? body.linked_discussion_id : null,
      initial_status: body.initial_status as ServiceRequestStatus | undefined,
    });
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
    return NextResponse.json({ data });
  }

  if (await canReportAftercareAsStakeholder(supabase, ctx, projectId)) {
    const { data, error } = await createServiceRequestStakeholder(supabase, ctx, projectId, {
      title: typeof body.title === "string" ? body.title : "",
      description: typeof body.description === "string" ? body.description : null,
    });
    if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
    if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
}
