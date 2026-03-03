import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateTenantForCurrentUser } from "@/lib/api/engine";
import { hasMinRole } from "@/lib/auth/tenant";

const INVITE_EXPIRES_DAYS = 7;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tenantId = await getOrCreateTenantForCurrentUser(supabase);
  if (!tenantId) return NextResponse.json({ error: "No tenant" }, { status: 403 });

  if (!(await hasMinRole(supabase, tenantId, "admin"))) {
    return NextResponse.json({ error: "Insufficient rights" }, { status: 403 });
  }

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
      created_by: user.id,
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const acceptLink = `${baseUrl}/invite/accept?token=${inv.token}`;
  return NextResponse.json({
    data: { id: inv.id, email: inv.email, role: inv.role, expires_at: inv.expires_at, accept_link: acceptLink },
  });
}
