/**
 * GET/PATCH /api/v1/projects/:id/decision-requests/:requestId — Phase 3 manager API.
 */

import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantForbiddenError,
  TenantRequiredError,
} from "@/lib/tenant";
import {
  getClientRequest,
  patchClientRequestByManager,
} from "@/lib/domain/client-requests/client-requests.service";
import type { ManagerPatchClientRequest } from "@/lib/domain/client-requests/client-requests.types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: projectId, requestId } = await context.params;
  if (!projectId || !requestId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }
  const supabase = await createClientFromRequest(request);
  const { data, error } = await getClientRequest(supabase, ctx, projectId, requestId, "manager");
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; requestId: string }> }
) {
  const { id: projectId, requestId } = await context.params;
  if (!projectId || !requestId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    if (e instanceof TenantForbiddenError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const body = await request.json().catch(() => ({}));
  const patch: ManagerPatchClientRequest | null =
    body.status === "completed" ? { status: "completed" } : body.status === "cancelled" ? { status: "cancelled" } : null;
  if (!patch) return NextResponse.json({ error: "status must be completed or cancelled" }, { status: 400 });

  const supabase = await createClientFromRequest(request);
  const { data, error } = await patchClientRequestByManager(supabase, ctx, projectId, requestId, patch);
  if (error === "Insufficient rights") return NextResponse.json({ error }, { status: 403 });
  if (!data) return NextResponse.json({ error: error || "Update failed" }, { status: 400 });
  return NextResponse.json({ data });
}
