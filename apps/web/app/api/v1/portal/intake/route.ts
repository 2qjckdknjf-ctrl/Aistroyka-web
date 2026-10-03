import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import {
  getTenantContextFromRequest,
  requireTenant,
  TenantForbiddenError,
  TenantRequiredError,
} from "@/lib/tenant";
import {
  createCustomerIntakeDraft,
  listCustomerIntakeDrafts,
  parseCreateCustomerIntakeInput,
} from "@/lib/domain/customer-intake/customer-intake.service";
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

export async function GET(request: Request) {
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
  const { data, error } = await listCustomerIntakeDrafts(supabase, scoped);
  if (error) return NextResponse.json({ error }, { status: error === "Tenant required" ? 401 : 400 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
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
  const parsed = parseCreateCustomerIntakeInput(body ?? {});
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const supabase = await createClientFromRequest(request);
  const resolved = await resolvePortalIntakeTenant(supabase, ctx, request, parsed.input.project_id ?? null);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const scoped = { ...ctx, tenantId: resolved.tenantId };
  const { data, error } = await createCustomerIntakeDraft(supabase, scoped, parsed.input);
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
