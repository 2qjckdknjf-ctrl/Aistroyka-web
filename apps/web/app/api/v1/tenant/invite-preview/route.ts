import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: inv, error } = await supabase
    .from("tenant_invitations")
    .select("id, tenant_id, email, role, expires_at, tenants(name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !inv) {
    return NextResponse.json({ error: "Invitation not found or expired." }, { status: 404 });
  }

  const isExpired = new Date(inv.expires_at) < new Date();
  if (isExpired) {
    return NextResponse.json({ error: "Invitation expired." }, { status: 410 });
  }

  const tenantName =
    typeof inv.tenants === "object" &&
    inv.tenants !== null &&
    "name" in inv.tenants &&
    typeof inv.tenants.name === "string"
      ? inv.tenants.name
      : "AISTROYKA company";

  return NextResponse.json({
    data: {
      tenantName,
      role: inv.role,
      email: inv.email,
      expiresAt: inv.expires_at,
    },
  });
}
