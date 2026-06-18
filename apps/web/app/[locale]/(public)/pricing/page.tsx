import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicPageHero,
  PublicProofSection,
  PublicTimelineSection,
} from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

const ENGAGEMENT_KEYS = ["pilot", "projectRollout", "multiProject", "enterpriseEvaluation"] as const;
const INCLUDED_KEYS = [
  "includedPlatform",
  "includedMobile",
  "includedConstructionAi",
  "includedCopilot",
  "includedSupport",
  "includedOnboarding",
] as const;
const PROCESS_KEYS = ["stepDiscovery", "stepPilot", "stepValidation", "stepRollout", "stepExpansion"] as const;
const TRUST_KEYS = ["trustPilotFirst", "trustScoped", "trustTransparent"] as const;

const RELATED_LINKS = [
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
  { href: "/enterprise", titleKey: "relatedEnterprise", descKey: "relatedEnterpriseDesc", linkKey: "linkEnterprise" },
] as const;

const linkFocusClass =
  "font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.pricing" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.pricing");
  const tCta = await getTranslations("public.cta");

  return (
    <>
      <PublicPageHero
        variant="compact"
        eyebrow={t("eyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        ctas={false}
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("engagementTitle")}
          subtitle={t("engagementSubtitle")}
          columns={2}
          items={ENGAGEMENT_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "pilot" ? "glass-highlight" : "solid",
            eyebrow: key === "pilot" ? t("pilotEyebrow") : undefined,
            href:
              key === "enterpriseEvaluation"
                ? "/enterprise"
                : key === "pilot"
                  ? "/dashboard"
                  : "/contact",
          }))}
        />

        <PublicFeatureGrid
          title={t("includedTitle")}
          subtitle={t("includedSubtitle")}
          columns={3}
          items={INCLUDED_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
            href:
              key === "includedPlatform"
                ? "/platform"
                : key === "includedMobile"
                  ? "/mobile"
                  : key === "includedConstructionAi"
                    ? "/ai-construction-control"
                    : key === "includedCopilot"
                      ? "/copilot"
                      : undefined,
          }))}
        />

        <PublicTimelineSection
          title={t("processTitle")}
          subtitle={t("processSubtitle")}
          steps={PROCESS_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <section aria-labelledby="pricing-trust-heading">
          <h2
            id="pricing-trust-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("trustTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("trustSubtitle")}
          </p>
          <div className="mt-8">
            <PublicProofSection
              variant="stat-row"
              stats={TRUST_KEYS.map((key) => ({
                value: t(`${key}Value`),
                label: t(`${key}Label`),
              }))}
            />
          </div>
        </section>

        <section aria-labelledby="pricing-related-heading">
          <h2
            id="pricing-related-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("relatedTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("relatedSubtitle")}
          </p>
          <ul className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {RELATED_LINKS.map(({ href, titleKey, descKey, linkKey }) => (
              <li
                key={href}
                className="rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface p-5 shadow-[var(--aistroyka-shadow-e1)]"
              >
                <h3 className="font-semibold text-aistroyka-text-primary">{t(titleKey)}</h3>
                <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                  {t(descKey)}
                </p>
                <Link href={href} className={`mt-4 inline-flex text-sm ${linkFocusClass}`}>
                  {t(linkKey)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <PublicCTASection
        variant="floating"
        title={t("ctaTitle")}
        subtitle={t("ctaSubtitle")}
        primaryLabel={tCta("launchPilot")}
        secondaryLabel={tCta("contactUs")}
        presentationLabel={tCta("getPresentation")}
        testIdPrefix="cta.public.pricing"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
