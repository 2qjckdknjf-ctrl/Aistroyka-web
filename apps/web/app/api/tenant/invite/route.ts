import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { inviteMember } from "@/lib/domain/tenants/tenant.service";
import { setLegacyApiHeaders } from "@/lib/api/deprecation-headers";

export async function POST(request: Request) {
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

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = ["admin", "member", "viewer"].includes(body.role) ? body.role : "member";

  const supabase = await createClient();
  const { data, error } = await inviteMember(supabase, ctx, { email, role });

  if (error) {
    const status = error === "Unauthorized" ? 401 : error.includes("required") ? 400 : error.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
  }

  const res = NextResponse.json({ data });
  setLegacyApiHeaders(res.headers);
  return res;
}
