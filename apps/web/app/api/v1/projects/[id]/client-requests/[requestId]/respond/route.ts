/**
 * POST /api/v1/projects/:id/client-requests/:requestId/respond — project owner (stakeholder) only.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, TenantForbiddenError, LitePathForbiddenError } from "@/lib/tenant";
import { notifyProjectManagers } from "@/lib/domain/notifications/manager-notifications.repository";
import { respondToClientRequest } from "@/lib/domain/client-requests/client-requests.service";
import { getAdminClient } from "@/lib/supabase/admin";
import type { RespondToClientRequestInput } from "@/lib/domain/client-requests/client-requests.types";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: projectId, requestId } = await context.params;
  if (!projectId || !requestId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

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

  const input: RespondToClientRequestInput = {
    decision: body.decision as RespondToClientRequestInput["decision"],
    feedback_text: typeof body.feedback_text === "string" ? body.feedback_text : undefined,
    acknowledged: typeof body.acknowledged === "boolean" ? body.acknowledged : undefined,
    choice_index: typeof body.choice_index === "number" ? body.choice_index : undefined,
    document_review_confirmed:
      typeof body.document_review_confirmed === "boolean" ? body.document_review_confirmed : undefined,
    note: typeof body.note === "string" ? body.note : null,
  };

  const supabase = await createClientFromRequest(request);
  const { data, error } = await respondToClientRequest(supabase, ctx, projectId, requestId, input);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Respond failed" }, { status: 400 });

  const admin = getAdminClient();
  if (admin && ctx.tenantId) {
    await notifyProjectManagers(admin, ctx.tenantId, projectId, {
      type: "client_request_responded",
      title: `Client responded: ${data.title}`,
      body: "A stakeholder submitted a response to a client request.",
      target_type: "client_request",
      target_id: requestId,
      project_id: projectId,
    });
  }

  return jsonWithCustomerFinanceGuard("POST /api/v1/projects/:id/client-requests/:requestId/respond", { data });
}
