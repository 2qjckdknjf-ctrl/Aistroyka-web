import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicJsonLd,
  PublicPageHero,
  PublicProofSection,
  PublicRelatedLinksSection,
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.pricing" });
  return buildPublicPageMetadata(locale, "/pricing", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.pricing");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/pricing",
    t("title"),
    tLayout("breadcrumbHome"),
  );

  return (
    <>
      <PublicJsonLd data={breadcrumbJsonLd} />
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

        <PublicRelatedLinksSection
          headingId="pricing-related-heading"
          title={t("relatedTitle")}
          subtitle={t("relatedSubtitle")}
          links={RELATED_LINKS.map(({ href, titleKey, descKey, linkKey }) => ({
            href,
            title: t(titleKey),
            description: t(descKey),
            linkLabel: t(linkKey),
          }))}
        />
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
