import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PUBLIC_PLAN_IDS } from "@/lib/public/pricing-catalog";
import { EnterpriseTeaser, FaqAccordion, FinalPilotCta, InternalPageHero, PilotTimeline, PricingCard, PricingComparison } from "@/components/public/v43";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.v43.pricing" });
  return { title: t("title"), description: t("lead") };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.v43.pricing");
  const tV41 = await getTranslations("public.v41");

  return (
    <>
      <InternalPageHero eyebrow={t("eyebrow")} title={t("h1")} lead={t("lead")} primaryLabel={tV41("launchPilot")} />
      <section className="v41-page v43-pricing-grid">
        {PUBLIC_PLAN_IDS.map((id) => (
          <PricingCard
            key={id}
            planId={id}
            locale={locale}
            chooseLabel={t("choose")}
            perUnit={t("perMonth")}
            copy={{
              name: t(`${id}Name`),
              description: t(`${id}Desc`),
              features: [t(`${id}F1`), t(`${id}F2`), t(`${id}F3`)],
              cta: t(`${id}Cta`),
              priceLabel: t(`${id}PriceLabel`),
              recommendedLabel: t("recommended"),
            }}
          />
        ))}
      </section>
      <section className="v41-page v41-section">
        <h2>{t("compareTitle")}</h2>
        <PricingComparison
          headers={[t("compareFeature"), t("starterName"), t("proName"), t("businessName"), t("enterpriseName")]}
          rows={[
            { label: t("rowSecurity"), values: [t("starterSecurity"), t("proSecurity"), t("businessSecurity"), t("enterpriseSecurity")] },
            { label: t("rowAnalytics"), values: [t("starterAnalytics"), t("proAnalytics"), t("businessAnalytics"), t("enterpriseAnalytics")] },
            { label: t("rowUsers"), values: [t("starterUsers"), t("proUsers"), t("businessUsers"), t("enterpriseUsers")] },
            { label: t("rowIntegrations"), values: [t("starterIntegrations"), t("proIntegrations"), t("businessIntegrations"), t("enterpriseIntegrations")] },
            { label: t("rowSupport"), values: [t("starterSupport"), t("proSupport"), t("businessSupport"), t("enterpriseSupport")] },
          ]}
        />
      </section>
      <PilotTimeline
        title={t("pilotTitle")}
        steps={[
          { n: "1", title: t("pilot1Title"), text: t("pilot1Text") },
          { n: "2", title: t("pilot2Title"), text: t("pilot2Text") },
          { n: "3", title: t("pilot3Title"), text: t("pilot3Text") },
          { n: "4", title: t("pilot4Title"), text: t("pilot4Text") },
        ]}
      />
      <EnterpriseTeaser title={t("enterpriseTeaserTitle")} lead={t("enterpriseTeaserLead")} cta={t("enterpriseCta")} />
      <FaqAccordion
        title={t("faqTitle")}
        items={[
          { q: t("faq1Q"), a: t("faq1A") },
          { q: t("faq2Q"), a: t("faq2A") },
          { q: t("faq3Q"), a: t("faq3A") },
        ]}
      />
      <FinalPilotCta
        copy={{
          eyebrow: tV41("pilotEyebrow"),
          title: tV41("pilotTitle"),
          lead: tV41("pilotLead"),
          launchPilot: tV41("launchPilot"),
          contact: tV41("contactUs"),
          note: tV41("pilotNote"),
        }}
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
