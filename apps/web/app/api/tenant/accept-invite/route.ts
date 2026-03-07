import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { acceptInvitation } from "@/lib/domain/tenants/tenant.service";
import * as invRepo from "@/lib/domain/tenants/invitation.repository";

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

  // Get invitation to verify email match
  const invitation = await invRepo.getInvitationByToken(supabase, token);
  if (!invitation) {
    return NextResponse.json({ error: "Invitation not found or expired" }, { status: 404 });
  }

  // Verify email match if invitation has email
  const inviteEmail = (invitation.email ?? "").toLowerCase();
  const userEmail = (user.email ?? "").toLowerCase();
  if (inviteEmail && inviteEmail !== userEmail) {
    return NextResponse.json(
      { error: "Invitation was sent to another email. Sign in with that account." },
      { status: 403 }
    );
  }

  // Accept invitation via service
  const { data, error } = await acceptInvitation(supabase, user.id, token);

  if (error) {
    const status = error === "Invitation not found or expired" ? 404 : error === "Invitation expired" ? 410 : 500;
    return NextResponse.json({ error }, { status });
  }

  if (!data) {
    return NextResponse.json({ error: "Failed to accept invitation" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
