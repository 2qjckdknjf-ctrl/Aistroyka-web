/**
 * POST /api/v1/projects/:id/stakeholder-discussions/:discussionId/entries
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { addDiscussionEntry } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.service";
import type { StakeholderDiscussionEntryKind } from "@/lib/domain/stakeholder-discussions/stakeholder-discussions.types";
import { getAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ id: string; discussionId: string }> }) {
  const { id: projectId, discussionId } = await context.params;
  if (!projectId || !discussionId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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
  const admin = getAdminClient() ?? undefined;
  const { data, error } = await addDiscussionEntry(supabase, admin, ctx, projectId, discussionId, {
    entry_kind: body.entry_kind as StakeholderDiscussionEntryKind,
    body: typeof body.body === "string" ? body.body : "",
  });
  if (error === "Discussion updates require server configuration") {
    return NextResponse.json({ error }, { status: 503 });
  }
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Failed" }, { status: 400 });
  return NextResponse.json({ data });
}
