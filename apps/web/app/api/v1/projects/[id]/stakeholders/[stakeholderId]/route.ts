/**
 * PATCH /api/v1/projects/:id/stakeholders/:stakeholderId — revoke (body { action: "revoke" }).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantRequiredError,
  TenantForbiddenError,
} from "@/lib/tenant";
import { emitStakeholderInviteSent } from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.emit";
import { canManageProjectStakeholders } from "@/lib/domain/stakeholders/stakeholders.policy";
import { getAdminClient } from "@/lib/supabase/admin";
import * as shRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import { revokeStakeholder } from "@/lib/domain/stakeholders/stakeholders.service";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; stakeholderId: string }> }
) {
  const { id: projectId, stakeholderId } = await context.params;
  if (!projectId || !stakeholderId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  let ctx: Awaited<ReturnType<typeof getTenantContextFromRequest>>;
  try {
    ctx = await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }

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

  const supabase = await createClientFromRequest(request);

  if (body.action === "resend_invite") {
    if (!(await canManageProjectStakeholders(supabase, ctx, projectId))) {
      return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
    }
    const admin = getAdminClient();
    if (!admin || !ctx.tenantId) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }
    const row = await shRepo.getById(admin, stakeholderId, ctx.tenantId);
    if (!row || row.project_id !== projectId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.status !== "invited") {
      return NextResponse.json({ error: "Only pending invitations can be resent" }, { status: 400 });
    }
    const invitePath = `/dashboard/stakeholder-invite?token=${row.token}`;
    await emitStakeholderInviteSent(admin, {
      tenantId: ctx.tenantId,
      projectId,
      inviteRow: row,
      invitePath,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action !== "revoke") {
    return NextResponse.json({ error: "action must be revoke or resend_invite" }, { status: 400 });
  }

  const { data, error } = await revokeStakeholder(supabase, ctx, projectId, stakeholderId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}
