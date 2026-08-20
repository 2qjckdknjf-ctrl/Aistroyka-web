"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button, Alert } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { DashboardGlassCard } from "@/components/dashboard/DashboardGlassCard";

type PlanKey = "starter" | "business" | "enterprise";

type Props = {
  locale: string;
  hasActiveSubscription: boolean;
  billingStatus: string | null;
  checkoutState: "idle" | "success" | "cancel";
  showDashboardAccessNotice?: boolean;
};

export function SubscribePlansClient({
  locale,
  hasActiveSubscription,
  billingStatus,
  checkoutState,
  showDashboardAccessNotice = false,
}: Props) {
  const router = useRouter();
  const t = useTranslations("subscriptionOnboarding");
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const awaitingActivation = checkoutState === "success" && !hasActiveSubscription;

  const plans = useMemo(
    () =>
      (["starter", "business", "enterprise"] as const).map((key) => ({
        key,
        title: t(`plans.${key}.title`),
        description: t(`plans.${key}.description`),
      })),
    [t]
  );

  async function startCheckout(planKey: PlanKey) {
    if (hasActiveSubscription || awaitingActivation) return;
    setLoadingPlan(planKey);
    setError(null);
    try {
      const origin = window.location.origin;
      const successUrl = `${origin}/${locale}/subscribe?checkout=success`;
      const cancelUrl = `${origin}/${locale}/subscribe?checkout=cancel`;
      const res = await fetch("/api/v1/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan_key: planKey,
          success_url: successUrl,
          cancel_url: cancelUrl,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? t("errors.generic"));
        return;
      }
      window.location.assign(json.url);
    } catch {
      setError(t("errors.generic"));
    } finally {
      setLoadingPlan(null);
    }
  }

  useEffect(() => {
    if (!awaitingActivation) return;
    pollAttemptsRef.current = 0;
    const timer = window.setInterval(() => {
      pollAttemptsRef.current += 1;
      router.refresh();
      if (pollAttemptsRef.current >= 24) {
        window.clearInterval(timer);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [awaitingActivation, router]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <DashboardGlassCard className="mb-6 border-l-4 border-l-aistroyka-accent">
        <h1 className="text-aistroyka-title2 font-semibold text-aistroyka-text-primary">
          {t("title")}
        </h1>
        <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
          {t("subtitle")}
        </p>
        {showDashboardAccessNotice ? (
          <p className="mt-4 text-aistroyka-subheadline text-aistroyka-text-primary">
            {t("dashboardAccessNotice")}
          </p>
        ) : null}
        <p className="mt-3 text-aistroyka-caption text-aistroyka-text-tertiary">
          {t("status", { status: billingStatus ?? "none" })}
        </p>
      </DashboardGlassCard>

      {checkoutState === "success" && !hasActiveSubscription ? (
        <>
          <Alert message={t("checkoutSuccess")} style="success" />
          <p className="mt-2 text-aistroyka-caption text-aistroyka-text-secondary">
            {t("checkingStatus")}
          </p>
        </>
      ) : null}
      {checkoutState === "cancel" ? <Alert message={t("checkoutCancel")} style="error" /> : null}
      {error ? <Alert message={error} style="error" /> : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {plans.map((plan) => (
          <DashboardGlassCard key={plan.key}>
            <h2 className="text-aistroyka-headline font-semibold text-aistroyka-text-primary">
              {plan.title}
            </h2>
            <p className="mt-2 text-aistroyka-subheadline text-aistroyka-text-secondary">
              {plan.description}
            </p>
            {hasActiveSubscription ? (
              <div className="mt-4">
                <Link href="/dashboard" className="inline-block">
                  <Button variant="primary">{t("openDashboard")}</Button>
                </Link>
              </div>
            ) : (
              <div className="mt-4">
                <Button
                  variant="primary"
                  onClick={() => startCheckout(plan.key)}
                  disabled={loadingPlan !== null || awaitingActivation}
                  loading={loadingPlan === plan.key}
                >
                  {loadingPlan === plan.key ? t("checkoutLoading") : t("checkoutButton")}
                </Button>
              </div>
            )}
          </DashboardGlassCard>
        ))}
      </div>
    </div>
  );
}
