import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenantContextFromRequest, requireTenant, TenantRequiredError, authorize } from "@/lib/tenant";
import { getAppUrl } from "@/lib/app-url";

const INVITE_EXPIRES_DAYS = 7;

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
  const supabase = await createClient();
  const tenantId = ctx.tenantId;
  const user = { id: ctx.userId };

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const role = ["admin", "member", "viewer"].includes(body.role) ? body.role : "member";
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRES_DAYS);

  const { data: inv, error } = await supabase
    .from("tenant_invitations")
    .insert({
      tenant_id: tenantId,
      email,
      role,
      created_by: ctx.userId,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token, email, role, expires_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Invitation for this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const baseUrl = getAppUrl();
  const acceptLink = `${baseUrl}/invite/accept?token=${inv.token}`;
  return NextResponse.json({
    data: { id: inv.id, email: inv.email, role: inv.role, expires_at: inv.expires_at, accept_link: acceptLink },
  });
}
