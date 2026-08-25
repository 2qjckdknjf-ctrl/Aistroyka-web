"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { CheckoutSummary } from "@/components/public/v43/CheckoutSummary";
import {
  formatPlanPrice,
  getPublicPlan,
  getSelfServePlans,
  type SelfServePlanId,
  type StripeCheckoutPlanKey,
} from "@/lib/public/pricing-catalog";

type Props = {
  locale: string;
  hasActiveSubscription: boolean;
  billingStatus: string | null;
  checkoutState: "idle" | "success" | "cancel";
  showDashboardAccessNotice?: boolean;
  selectedPlanId?: SelfServePlanId | null;
};

export function SubscribePlansClient({
  locale,
  hasActiveSubscription,
  billingStatus,
  checkoutState,
  showDashboardAccessNotice = false,
  selectedPlanId = null,
}: Props) {
  const router = useRouter();
  const t = useTranslations("subscriptionOnboarding");
  const tCheckout = useTranslations("public.v43.checkout");
  const tPricing = useTranslations("public.v43.pricing");
  const [loadingPlan, setLoadingPlan] = useState<StripeCheckoutPlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollAttemptsRef = useRef(0);
  const awaitingActivation = checkoutState === "success" && !hasActiveSubscription;
  const selected = selectedPlanId ? getPublicPlan(selectedPlanId) : null;
  const selectedSelfServe = selected && selected.checkoutEnabled ? selected : null;

  async function startCheckout(planKey: StripeCheckoutPlanKey) {
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
    <div className="v43-checkout-page">
      <div className="v41-page">
        <p>
          <Link href="/pricing">{tCheckout("back")}</Link>
        </p>
        <h1>{selectedSelfServe ? tCheckout("title", { plan: selectedSelfServe.name }) : t("title")}</h1>
        <p className="v41-lead">{t("subtitle")}</p>
        {showDashboardAccessNotice ? <p>{t("dashboardAccessNotice")}</p> : null}
        <p>{t("status", { status: billingStatus ?? "none" })}</p>
        {checkoutState === "success" && !hasActiveSubscription ? (
          <>
            <Alert message={t("checkoutSuccess")} style="success" />
            <p>{t("checkingStatus")}</p>
          </>
        ) : null}
        {checkoutState === "cancel" ? <Alert message={t("checkoutCancel")} style="error" /> : null}
        {error ? <Alert message={error} style="error" /> : null}

        {selectedSelfServe ? (
          <div className="v43-checkout-grid">
            <article className="v43-plan-card v41-glass">
              <h2>{selectedSelfServe.name}</h2>
              <p>{tPricing(`${selectedSelfServe.id}Desc`)}</p>
              <p className="v43-plan-price">
                {formatPlanPrice(selectedSelfServe, locale)}/{tPricing("perMonth")}
              </p>
              <ul>
                <li>{tPricing(`${selectedSelfServe.id}F1`)}</li>
                <li>{tPricing(`${selectedSelfServe.id}F2`)}</li>
                <li>{tPricing(`${selectedSelfServe.id}F3`)}</li>
              </ul>
            </article>
            <CheckoutSummary
              plan={selectedSelfServe}
              locale={locale}
              title={tCheckout("order")}
              changeLabel={tCheckout("change")}
              features={[
                tPricing(`${selectedSelfServe.id}F1`),
                tPricing(`${selectedSelfServe.id}F2`),
                tPricing(`${selectedSelfServe.id}F3`),
              ]}
              periodLabel={tCheckout("period")}
              periodValue={tCheckout("monthly")}
              totalLabel={tCheckout("dueToday")}
              payLabel={tCheckout("pay")}
              terms={tCheckout("terms")}
              onPay={() => startCheckout(selectedSelfServe.checkoutPlanKey)}
              loading={loadingPlan === selectedSelfServe.checkoutPlanKey}
              disabled={hasActiveSubscription || awaitingActivation}
            />
          </div>
        ) : (
          <div className="v43-pricing-grid">
            {getSelfServePlans().map((plan) => (
              <article key={plan.id} className="v43-plan-card v41-glass">
                <h2>{plan.name}</h2>
                <p>{tPricing(`${plan.id}Desc`)}</p>
                <p className="v43-plan-price">
                  {formatPlanPrice(plan, locale)}/{tPricing("perMonth")}
                </p>
                {hasActiveSubscription ? (
                  <Link className="v41-btn v41-btn-primary" href="/dashboard">
                    {t("openDashboard")}
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="v41-btn v41-btn-primary"
                    onClick={() => startCheckout(plan.checkoutPlanKey)}
                    disabled={loadingPlan !== null || awaitingActivation}
                  >
                    {loadingPlan === plan.checkoutPlanKey ? t("checkoutLoading") : tCheckout("pay")} {formatPlanPrice(plan, locale)}
                  </button>
                )}
              </article>
            ))}
            <article className="v43-plan-card v41-glass">
              <h2>{tPricing("enterpriseName")}</h2>
              <p>{tPricing("enterpriseDesc")}</p>
              <Link className="v41-btn v41-btn-secondary" href="/pricing/enterprise">
                {tPricing("enterpriseCta")}
              </Link>
            </article>
          </div>
        )}
      </div>
    </div>
  );
}
