import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  createTenantAndOwnerMembershipForCurrentUser,
  getTenantForCurrentUser,
} from "@/lib/api/engine";
import { isOnboardingPersona } from "@/lib/onboarding/user-onboarding";

const CompleteOnboardingSchema = z.object({
  persona: z.string(),
  companyName: z.string().trim().max(200).optional().nullable(),
  companyType: z.enum(["customer", "developer", "contractor", "supervisor", "other"]).optional().nullable(),
  inviteToken: z.string().trim().uuid().optional().nullable(),
});

async function acceptInviteByToken(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null },
  token: string
): Promise<{ tenantId: string; role: string } | { error: string; status: number }> {
  const { data: inv, error } = await supabase
    .from("tenant_invitations")
    .select("id, tenant_id, email, role, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (error || !inv) return { error: "Invitation not found or expired", status: 404 };
  if (new Date(inv.expires_at) < new Date()) return { error: "Invitation expired", status: 410 };

  const inviteEmail = (inv.email ?? "").toLowerCase();
  const userEmail = (user.email ?? "").toLowerCase();
  if (inviteEmail && inviteEmail !== userEmail) {
    return {
      error: "Invitation was sent to another email. Sign in with that account.",
      status: 403,
    };
  }

  const { error: upsertError } = await supabase.from("tenant_members").upsert(
    {
      tenant_id: inv.tenant_id,
      user_id: user.id,
      role: inv.role,
    },
    { onConflict: "tenant_id,user_id" }
  );
  if (upsertError) return { error: "Unable to join the workspace.", status: 500 };

  await supabase.from("tenant_invitations").delete().eq("id", inv.id);
  return { tenantId: inv.tenant_id, role: inv.role };
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const db = supabase as any;
  const user = await getSessionUser(supabase);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = CompleteOnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid onboarding payload." }, { status: 400 });
  }

  const personaRaw = parsed.data.persona.trim();
  if (!isOnboardingPersona(personaRaw)) {
    return NextResponse.json({ error: "Invalid persona." }, { status: 400 });
  }
  const persona = personaRaw;
  const inviteToken = parsed.data.inviteToken ?? null;
  const companyName = parsed.data.companyName?.trim() || null;
  const companyType = parsed.data.companyType ?? null;

  let tenantId = await getTenantForCurrentUser(supabase);
  let invitedViaToken: string | null = null;

  if (inviteToken) {
    const accepted = await acceptInviteByToken(supabase, user, inviteToken);
    if ("error" in accepted) {
      return NextResponse.json({ error: accepted.error }, { status: accepted.status });
    }
    tenantId = accepted.tenantId;
    invitedViaToken = inviteToken;
  }

  if (!tenantId && persona !== "invited_worker_manager" && persona !== "customer") {
    const createdTenantId = await createTenantAndOwnerMembershipForCurrentUser(supabase, {
      name: companyName || "New company",
      companyType,
    });
    tenantId = createdTenantId;
  }

  const { error: profileError } = await db.from("user_onboarding_profiles").upsert(
    {
      user_id: user.id,
      persona,
      company_name: companyName,
      company_type: companyType,
      onboarding_completed: true,
      tenant_id: tenantId,
      invited_via_token: invitedViaToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
  if (profileError) {
    return NextResponse.json({ error: "Failed to persist onboarding profile." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    onboardingCompleted: true,
    tenantId: tenantId ?? null,
    nextPath: "/dashboard",
  });
}
