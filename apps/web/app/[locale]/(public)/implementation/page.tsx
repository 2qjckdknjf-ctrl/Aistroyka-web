import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { PublicCTASection, PublicFeatureGrid, PublicPageHero, PublicTimelineSection, PublicJsonLd } from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

type Readiness = "live" | "partial" | "planned";

const DEPLOYMENT_PHASES = [
  "phaseDiscovery",
  "phasePilot",
  "phaseConfiguration",
  "phaseTraining",
  "phaseRollout",
  "phaseExpansion",
] as const;

const ADOPTION_ROLES: ReadonlyArray<{ key: string; readiness: Readiness; highlight?: boolean }> = [
  { key: "adoptWorkers", readiness: "partial" },
  { key: "adoptManagers", readiness: "live", highlight: true },
  { key: "adoptOwners", readiness: "partial" },
  { key: "adoptStakeholders", readiness: "live" },
];

const PILOT_KEYS = ["pilotScope", "pilotWorkspace", "pilotFieldCapture", "pilotManagerReview", "pilotFeedback"] as const;
const RISK_KEYS = ["riskScopeCreep", "riskConnectivity", "riskRoles", "riskDevices", "riskReviewDiscipline"] as const;

const RELATED_LINKS = [
  { href: "/pricing", titleKey: "relatedPricing", descKey: "relatedPricingDesc", linkKey: "linkPricing" },
  { href: "/enterprise", titleKey: "relatedEnterprise", descKey: "relatedEnterpriseDesc", linkKey: "linkEnterprise" },
  { href: "/security", titleKey: "relatedSecurity", descKey: "relatedSecurityDesc", linkKey: "linkSecurity" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

const linkFocusClass =
  "font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

function statusKey(readiness: Readiness): "statusLive" | "statusPartial" | "statusPlanned" {
  switch (readiness) {
    case "live":
      return "statusLive";
    case "partial":
      return "statusPartial";
    case "planned":
      return "statusPlanned";
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.implementation" });
  return buildPublicPageMetadata(locale, "/implementation", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function ImplementationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.implementation");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/implementation",
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
        <PublicTimelineSection
          title={t("phasesTitle")}
          subtitle={t("phasesSubtitle")}
          steps={DEPLOYMENT_PHASES.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            status: t(`${key}Status`),
          }))}
        />

        <PublicFeatureGrid
          title={t("adoptionTitle")}
          subtitle={t("adoptionSubtitle")}
          columns={2}
          items={ADOPTION_ROLES.map(({ key, readiness, highlight }) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            variant: highlight ? "glass-highlight" : "solid",
            eyebrow: t(statusKey(readiness)),
          }))}
        />

        <PublicFeatureGrid
          title={t("pilotTitle")}
          subtitle={t("pilotSubtitle")}
          columns={2}
          items={PILOT_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicFeatureGrid
          title={t("risksTitle")}
          subtitle={t("risksSubtitle")}
          columns={2}
          items={RISK_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <section aria-labelledby="implementation-related-heading">
          <h2
            id="implementation-related-heading"
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
        testIdPrefix="cta.public.implementation"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
