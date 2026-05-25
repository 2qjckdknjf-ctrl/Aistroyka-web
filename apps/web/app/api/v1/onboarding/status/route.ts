import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getTenantForCurrentUser } from "@/lib/api/engine";
import { getOnboardingProfile, shouldShowOnboarding } from "@/lib/onboarding/user-onboarding";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, tenantId, showOnboarding] = await Promise.all([
    getOnboardingProfile(supabase, user.id),
    getTenantForCurrentUser(supabase),
    shouldShowOnboarding(supabase, user.id),
  ]);

  const normalizedEmail = (user.email ?? "").trim().toLowerCase();
  let hasPendingInvite = false;
  if (normalizedEmail) {
    const { data: pendingInvite } = await supabase
      .from("tenant_invitations")
      .select("id")
      .eq("email", normalizedEmail)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    hasPendingInvite = Boolean(pendingInvite?.id);
  }

  return NextResponse.json({
    showOnboarding,
    onboardingCompleted: profile?.onboarding_completed === true,
    profile: {
      persona: profile?.persona ?? null,
      companyName: profile?.company_name ?? null,
      companyType: profile?.company_type ?? null,
    },
    tenantId: tenantId ?? null,
    hasPendingInvite,
  });
}
