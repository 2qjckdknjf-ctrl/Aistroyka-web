import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantForbiddenError,
  TenantRequiredError,
} from "@/lib/tenant";
import { updateCustomerIntakeDraft } from "@/lib/domain/customer-intake/customer-intake.service";
import { resolvePortalIntakeTenant } from "@/lib/domain/customer-intake/portal-intake-tenant";

export const dynamic = "force-dynamic";

async function tenantContext(request: Request) {
  try {
    return await getTenantContextFromRequest(request);
  } catch (e) {
    if (e instanceof TenantForbiddenError) {
      return NextResponse.json({ error: e.message }, { status: 403 });
    }
    throw e;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id: draftId } = await context.params;
  if (!draftId?.trim()) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const ctxOrDenied = await tenantContext(request);
  if (ctxOrDenied instanceof NextResponse) return ctxOrDenied;
  const ctx = ctxOrDenied;
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const projectId =
    body && typeof body === "object" && !Array.isArray(body) && "project_id" in body
      ? (body as { project_id?: unknown }).project_id
      : undefined;
  const projectHint =
    typeof projectId === "string" && projectId.trim() ? projectId.trim() : null;

  const supabase = await createClientFromRequest(request);
  const resolved = await resolvePortalIntakeTenant(supabase, ctx, request, projectHint);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const scoped = { ...ctx, tenantId: resolved.tenantId };
  const { data, error } = await updateCustomerIntakeDraft(supabase, scoped, draftId.trim(), body);
  if (!data) {
    if (error === "Update denied") return NextResponse.json({ error }, { status: 403 });
    if (error === "Tenant required") return NextResponse.json({ error }, { status: 401 });
    return NextResponse.json({ error: error || "Update failed" }, { status: 400 });
  }
  return NextResponse.json({ data });
}
