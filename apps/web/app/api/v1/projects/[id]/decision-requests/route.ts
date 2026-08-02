/**
 * GET/POST /api/v1/projects/:id/decision-requests — Phase 3 canonical manager API.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantForbiddenError, TenantRequiredError, LitePathForbiddenError } from "@/lib/tenant";
import {
  createClientRequest,
  listClientRequests,
} from "@/lib/domain/client-requests/client-requests.service";
import { createInputFromDecisionBody } from "@/lib/domain/decision-requests/decision-requests.adapter";

export const dynamic = "force-dynamic";

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
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  const url = new URL(request.url);
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listClientRequests(supabase, ctx, projectId, {
    viewer: "manager",
    status: url.searchParams.get("status") ?? "all",
  });
  if (error) return NextResponse.json({ error }, { status: 403 });
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
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = await createClientFromRequest(request);
  const { data, error } = await createClientRequest(supabase, ctx, projectId, createInputFromDecisionBody(body));
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
  return NextResponse.json({ data });
}
