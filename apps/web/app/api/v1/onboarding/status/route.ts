import { NextResponse } from "next/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { resolveTenantForCurrentUser } from "@/lib/api/engine";
import { isActiveTenantResolutionBlocked } from "@/lib/tenant/active-tenant";
import { getOnboardingProfile, shouldShowOnboarding } from "@/lib/onboarding/user-onboarding";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const active = await resolveTenantForCurrentUser(supabase, request);
  if (isActiveTenantResolutionBlocked(active)) {
    return NextResponse.json(
      {
        error: active.queryError
          ? "Active tenant lookup failed."
          : "Active tenant selection rejected.",
        code: "ACTIVE_TENANT_BLOCKED",
      },
      { status: active.queryError ? 503 : 403 }
    );
  }

  const [profile, showOnboarding] = await Promise.all([
    getOnboardingProfile(supabase, user.id),
    shouldShowOnboarding(supabase, user.id, request),
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
    tenantId: active.tenantId ?? null,
    hasPendingInvite,
  });
}
