import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { listMembers } from "@/lib/domain/tenants/tenant.service";

export async function GET(request: Request) {
  const ctx = await getTenantContextFromRequest(request);
  try {
    requireTenant(ctx);
  } catch (e) {
    if (e instanceof TenantRequiredError) {
      return NextResponse.json({ error: e.message }, { status: e.message.includes("membership") ? 403 : 401 });
    }
    throw e;
  }
  if (!authorize(ctx, "tenant:invite")) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data, error } = await listMembers(supabase, ctx);

  if (error) {
    const status = error === "Unauthorized" ? 401 : error === "Tenant not found" ? 404 : 400;
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({ data });
}
