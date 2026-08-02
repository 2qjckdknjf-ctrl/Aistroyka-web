/**
 * GET/POST /api/v1/projects/:id/client-requests
 * GET: managers see full rows; project owners (portal on) see stakeholder-safe rows.
 * POST: create (managers only).
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { canManageClientRequests } from "@/lib/domain/client-requests/client-requests.policy";
import { emitClientRequestCreatedForStakeholders } from "@/lib/domain/stakeholder-notifications/stakeholder-notifications.emit";
import { emitTelegramForNewClientRequest } from "@/lib/platform/telegram/telegram-notifications.emit";
import { getAdminClient } from "@/lib/supabase/admin";
import {
  createClientRequest,
  listClientRequests,
} from "@/lib/domain/client-requests/client-requests.service";
import type { CreateClientRequestInput } from "@/lib/domain/client-requests/client-requests.types";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

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

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;

  const supabase = await createClientFromRequest(request);

  if (await canManageClientRequests(supabase, ctx, projectId)) {
    const { data, error } = await listClientRequests(supabase, ctx, projectId, {
      viewer: "manager",
      status: status ?? "all",
    });
    if (error) return NextResponse.json({ error }, { status: 403 });
    return NextResponse.json({ data });
  }

  const { data, error } = await listClientRequests(supabase, ctx, projectId, {
    viewer: "stakeholder",
    status: status ?? "all",
  });
  if (error) return NextResponse.json({ error }, { status: 403 });
  return jsonWithCustomerFinanceGuard("GET /api/v1/projects/:id/client-requests", { data });
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

  const input: CreateClientRequestInput = {
    kind: body.kind as CreateClientRequestInput["kind"],
    action_mode: body.action_mode as CreateClientRequestInput["action_mode"],
    title: typeof body.title === "string" ? body.title : "",
    instructions: typeof body.instructions === "string" ? body.instructions : null,
    choice_options: Array.isArray(body.choice_options)
      ? body.choice_options.filter((x): x is string => typeof x === "string")
      : null,
    linked_entity_type: body.linked_entity_type as CreateClientRequestInput["linked_entity_type"],
    linked_entity_id: typeof body.linked_entity_id === "string" ? body.linked_entity_id : null,
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createClientRequest(supabase, ctx, projectId, input);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });

  const admin = getAdminClient();
  if (admin && ctx.tenantId) {
    await emitClientRequestCreatedForStakeholders(admin, {
      tenantId: ctx.tenantId,
      projectId,
      requestId: data.id,
      title: data.title,
      instructions: data.instructions ?? null,
    });
    await emitTelegramForNewClientRequest(admin, {
      tenantId: ctx.tenantId,
      projectId,
      title: data.title,
    });
  }

  return NextResponse.json({ data });
}
