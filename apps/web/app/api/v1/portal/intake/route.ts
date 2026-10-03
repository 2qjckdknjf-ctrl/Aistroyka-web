import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError } from "@/lib/tenant";
import {
  createCustomerIntakeDraft,
  listCustomerIntakeDrafts,
} from "@/lib/domain/customer-intake/customer-intake.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) return NextResponse.json({ error: e.message }, { status: 401 });
    throw e;
  }
  const supabase = await createClientFromRequest(request);
  const { data, error } = await listCustomerIntakeDrafts(supabase, ctx);
  if (error) return NextResponse.json({ error }, { status: error === "Tenant required" ? 401 : 400 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
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
  const supabase = await createClientFromRequest(request);
  const { data, error } = await createCustomerIntakeDraft(
    supabase,
    ctx,
    (body ?? {}) as Parameters<typeof createCustomerIntakeDraft>[2]
  );
  if (!data) return NextResponse.json({ error: error || "Create failed" }, { status: 400 });
  return NextResponse.json({ data }, { status: 201 });
}
