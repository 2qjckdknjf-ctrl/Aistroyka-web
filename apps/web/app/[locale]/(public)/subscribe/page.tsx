import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { SubscribePlansClient } from "@/components/billing/SubscribePlansClient";
import { getActiveSubscriptionStateForUser } from "@/lib/platform/billing/subscription-gate";
import { enterpriseDetailPath, lookupPublicPlan } from "@/lib/public/pricing-catalog";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ checkout?: string; dashboard_access?: string; plan?: string }>;
};

export default async function SubscribePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = (await searchParams) ?? {};
  const checkout = sp.checkout ?? "";
  const showDashboardAccessNotice = sp.dashboard_access === "require_subscription";
  const checkoutState = checkout === "success" ? "success" : checkout === "cancel" ? "cancel" : "idle";
  const publicPlan = lookupPublicPlan(sp.plan);
  if (publicPlan?.id === "enterprise") {
    redirect(enterpriseDetailPath(locale));
  }
  if (publicPlan?.id === "business") {
    redirect(`/${locale}/contact?plan=business`);
  }

  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    const next =
      publicPlan && publicPlan.checkoutEnabled
        ? `/${locale}/subscribe?plan=${publicPlan.id}`
        : `/${locale}/subscribe`;
    redirect(`/${locale}/login?next=${encodeURIComponent(next)}`);
  }

  const sessionUser = user;
  const admin = getAdminClient();
  let hasActiveSubscription = false;
  let hasDashboardAccess = false;
  let billingStatus: string | null = null;
  let tenantId: string | null = null;
  if (admin && sessionUser) {
    const state = await getActiveSubscriptionStateForUser(admin, sessionUser.id);
    hasActiveSubscription = state.hasActiveSubscription;
    hasDashboardAccess = state.hasDashboardAccess;
    billingStatus = state.billingStatus;
    tenantId = state.tenantId;
  }

  if (tenantId && hasDashboardAccess) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <SubscribePlansClient
      locale={locale}
      hasActiveSubscription={hasActiveSubscription}
      billingStatus={billingStatus}
      checkoutState={checkoutState}
      showDashboardAccessNotice={showDashboardAccessNotice}
      selectedPlanId={publicPlan && publicPlan.checkoutEnabled ? publicPlan.id : null}
    />
  );
}
