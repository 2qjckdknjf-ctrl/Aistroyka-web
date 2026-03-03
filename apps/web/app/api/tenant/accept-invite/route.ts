import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST: accept invitation by token. Body: { token: string } */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const { data: inv, error: invError } = await supabase
    .from("tenant_invitations")
    .select("id, tenant_id, email, role, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (invError || !inv) {
    return NextResponse.json({ error: "Invitation not found or expired" }, { status: 404 });
  }

  if (new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invitation expired" }, { status: 410 });
  }

  const inviteEmail = (inv.email ?? "").toLowerCase();
  const userEmail = (user.email ?? "").toLowerCase();
  if (inviteEmail && inviteEmail !== userEmail) {
    return NextResponse.json(
      { error: "Invitation was sent to another email. Sign in with that account." },
      { status: 403 }
    );
  }

  const { error: insertError } = await supabase.from("tenant_members").upsert(
    {
      tenant_id: inv.tenant_id,
      user_id: user.id,
      role: inv.role,
    },
    { onConflict: "tenant_id,user_id" }
  );

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabase
    .from("tenant_invitations")
    .delete()
    .eq("id", inv.id);

  return NextResponse.json({
    data: { tenant_id: inv.tenant_id, role: inv.role },
  });
}
