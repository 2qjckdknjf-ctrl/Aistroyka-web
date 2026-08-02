/**
 * GET/POST /api/v1/projects/:id/estimates — customer-facing estimates.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import { createCustomerEstimate, listCustomerEstimates } from "@/lib/domain/customer-estimates/customer-estimates.service";
import { jsonWithCustomerFinanceGuard } from "@/lib/security/customer-finance-response";

export const dynamic = "force-dynamic";

function inputFromBody(body: Record<string, unknown>) {
  return {
    title: typeof body.title === "string" ? body.title : "",
    description: typeof body.description === "string" ? body.description : null,
    total_amount: typeof body.total_amount === "number" ? body.total_amount : Number(body.total_amount),
    currency: typeof body.currency === "string" ? body.currency : undefined,
    valid_until: typeof body.valid_until === "string" ? body.valid_until : null,
    linked_document_id: typeof body.linked_document_id === "string" ? body.linked_document_id : null,
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const viewer = new URL(request.url).searchParams.get("viewer") === "customer" ? "customer" : "manager";
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listCustomerEstimates(supabase, ctx, projectId, viewer);
  if (error) return NextResponse.json({ error }, { status: 403 });
  if (viewer === "customer") {
    return jsonWithCustomerFinanceGuard("GET /api/v1/projects/:id/estimates", { data });
  }
  return NextResponse.json({ data });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const body = await request.json().catch(() => ({}));
  const supabase = await createClientFromRequest(request);
  const { data, error } = await createCustomerEstimate(supabase, ctx, projectId, inputFromBody(body));
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
