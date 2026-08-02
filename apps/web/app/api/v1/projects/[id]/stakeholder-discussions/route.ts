/**
 * GET/POST /api/v1/projects/:id/stakeholder-discussions
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { createDiscussion, listDiscussions } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.service";
import type { StakeholderDiscussionKind } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.types";

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
  const { data, error } = await listDiscussions(supabase, ctx, projectId);
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
  const { data, error } = await createDiscussion(supabase, ctx, projectId, {
    kind: body.kind as StakeholderDiscussionKind,
    title: typeof body.title === "string" ? body.title : "",
    context: typeof body.context === "string" ? body.context : null,
    linked_entity_type: body.linked_entity_type as never,
    linked_entity_id: typeof body.linked_entity_id === "string" ? body.linked_entity_id : null,
    initial_status: body.initial_status as never,
  });
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
  return NextResponse.json({ data });
}
