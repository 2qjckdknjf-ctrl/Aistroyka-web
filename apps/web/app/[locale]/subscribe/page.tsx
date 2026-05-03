import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import { getAdminClient } from "@/lib/supabase/admin";
import { SubscribePlansClient } from "@/components/billing/SubscribePlansClient";
import { getActiveSubscriptionStateForUser } from "@/lib/platform/billing/subscription-gate";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ checkout?: string }>;
};

export default async function SubscribePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const checkout = (await searchParams)?.checkout ?? "";
  const checkoutState = checkout === "success" ? "success" : checkout === "cancel" ? "cancel" : "idle";

  const supabase = await createClient();
  const user = await getSessionUser(supabase);
  if (!user) {
    redirect(`/${locale}/login?next=/${locale}/subscribe`);
  }

  const admin = getAdminClient();
  let hasActiveSubscription = false;
  let billingStatus: string | null = null;
  let tenantId: string | null = null;
  if (admin) {
    const state = await getActiveSubscriptionStateForUser(admin, user.id);
    hasActiveSubscription = state.hasActiveSubscription;
    billingStatus = state.billingStatus;
    tenantId = state.tenantId;
  }

  if (tenantId && hasActiveSubscription) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <SubscribePlansClient
      locale={locale}
      hasActiveSubscription={hasActiveSubscription}
      billingStatus={billingStatus}
      checkoutState={checkoutState}
    />
  );
}
