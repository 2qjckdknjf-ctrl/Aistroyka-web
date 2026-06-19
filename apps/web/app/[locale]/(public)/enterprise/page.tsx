import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { PublicCTASection, PublicFeatureGrid, PublicPageHero, PublicTimelineSection, PublicJsonLd } from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

const GOVERNANCE_KEYS = [
  "govRoleGovernance",
  "govAccessControl",
  "govAuditability",
  "govProjectVisibility",
] as const;

const SECURITY_KEYS = [
  "secTenantIsolation",
  "secDataHandling",
  "secPermissions",
  "secOperationalTransparency",
] as const;

const AI_KEYS = [
  "aiHumanReview",
  "aiExplainableFindings",
  "aiReviewWorkflows",
  "aiControlledRecommendations",
] as const;

const ROLLOUT_KEYS = [
  "rollMultiProject",
  "rollStakeholderVisibility",
  "rollOrganizationalAdoption",
  "rollChangeManagement",
] as const;

const EVALUATION_KEYS = [
  "evalAssessment",
  "evalPilot",
  "evalValidation",
  "evalRollout",
  "evalExpansion",
] as const;

const RELATED_LINKS = [
  { href: "/pricing", titleKey: "relatedPricing", descKey: "relatedPricingDesc", linkKey: "linkPricing" },
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
  { href: "/faq", titleKey: "relatedFaq", descKey: "relatedFaqDesc", linkKey: "linkFaq" },
] as const;

const GOVERNANCE_HREFS: Partial<Record<(typeof GOVERNANCE_KEYS)[number], string>> = {
  govRoleGovernance: "/faq",
  govAccessControl: "/faq",
  govAuditability: "/platform",
  govProjectVisibility: "/platform",
};

const SECURITY_HREFS: Partial<Record<(typeof SECURITY_KEYS)[number], string>> = {
  secTenantIsolation: "/faq",
  secDataHandling: "/security",
  secPermissions: "/faq",
  secOperationalTransparency: "/about",
};

const AI_HREFS: Partial<Record<(typeof AI_KEYS)[number], string>> = {
  aiHumanReview: "/ai-construction-control",
  aiExplainableFindings: "/ai-construction-control",
  aiReviewWorkflows: "/ai-construction-control",
  aiControlledRecommendations: "/copilot",
};

const ROLLOUT_HREFS: Partial<Record<(typeof ROLLOUT_KEYS)[number], string>> = {
  rollMultiProject: "/pricing",
  rollStakeholderVisibility: "/platform",
  rollOrganizationalAdoption: "/contact",
  rollChangeManagement: "/implementation",
};

const linkFocusClass =
  "font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.enterprise" });
  return buildPublicPageMetadata(locale, "/enterprise", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function EnterprisePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.enterprise");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/enterprise",
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
          title={t("governanceTitle")}
          subtitle={t("governanceSubtitle")}
          columns={2}
          items={GOVERNANCE_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "govRoleGovernance" ? "glass-highlight" : "solid",
            eyebrow: key === "govRoleGovernance" ? t("govRoleGovernanceEyebrow") : undefined,
            href: GOVERNANCE_HREFS[key],
          }))}
        />

        <PublicFeatureGrid
          title={t("securityTitle")}
          subtitle={t("securitySubtitle")}
          columns={2}
          items={SECURITY_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
            href: SECURITY_HREFS[key],
          }))}
        />

        <PublicFeatureGrid
          title={t("aiTitle")}
          subtitle={t("aiSubtitle")}
          columns={2}
          items={AI_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
            href: AI_HREFS[key],
          }))}
        />

        <PublicFeatureGrid
          title={t("rolloutTitle")}
          subtitle={t("rolloutSubtitle")}
          columns={2}
          items={ROLLOUT_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
            href: ROLLOUT_HREFS[key],
          }))}
        />

        <PublicTimelineSection
          title={t("evaluationTitle")}
          subtitle={t("evaluationSubtitle")}
          steps={EVALUATION_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <section aria-labelledby="enterprise-related-heading">
          <h2
            id="enterprise-related-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("relatedTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("relatedSubtitle")}
          </p>
          <ul className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
        testIdPrefix="cta.public.enterprise"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
