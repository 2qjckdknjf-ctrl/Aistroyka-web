/**
 * GET/POST /api/v1/projects/:id/stakeholders — manager controls.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { getAdminClient } from "@/lib/supabase/admin";
import { emitStakeholderInviteSent } from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.emit";
import * as shRepo from "@/lib/domain/stakeholders/stakeholders.repository";
import { inviteStakeholder, listStakeholders } from "@/lib/domain/stakeholders/stakeholders.service";
import type { InviteStakeholderInput } from "@/lib/domain/stakeholders/stakeholders.types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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
  const { data, error } = await listStakeholders(supabase, ctx, projectId);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json({ data });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await context.params;
  if (!projectId) return NextResponse.json({ error: "Missing project id" }, { status: 400 });

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

  const input: InviteStakeholderInput = {
    email: typeof body.email === "string" ? body.email : "",
    stakeholder_role: body.stakeholder_role as InviteStakeholderInput["stakeholder_role"],
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await inviteStakeholder(supabase, ctx, projectId, input);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Invite failed" }, { status: 400 });

  const admin = getAdminClient();
  if (admin && ctx.tenantId) {
    const row = await shRepo.getById(admin, data.id, ctx.tenantId);
    if (row) {
      await emitStakeholderInviteSent(admin, {
        tenantId: ctx.tenantId,
        projectId,
        inviteRow: row,
        invitePath: data.invite_path,
      });
    }
  }

  return NextResponse.json({ data });
}
