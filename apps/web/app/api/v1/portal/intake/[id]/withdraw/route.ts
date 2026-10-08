import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantForbiddenError,
  TenantRequiredError,
} from "@/lib/tenant";
import { withdrawCustomerIntakeDraft } from "@/lib/domain/customer-intake/customer-intake.service";
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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const supabase = await createClientFromRequest(request);
  const resolved = await resolvePortalIntakeTenant(supabase, ctx, request, null);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const scoped = { ...ctx, tenantId: resolved.tenantId };
  const { data, error } = await withdrawCustomerIntakeDraft(supabase, scoped, draftId.trim());
  if (!data) {
    if (error === "Update denied") return NextResponse.json({ error }, { status: 403 });
    if (error === "Tenant required") return NextResponse.json({ error }, { status: 401 });
    return NextResponse.json({ error: error || "Withdraw failed" }, { status: 400 });
  }
  return NextResponse.json({ data });
}
