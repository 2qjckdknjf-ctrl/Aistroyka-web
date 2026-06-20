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
  PublicRelatedLinksSection,
  PublicTimelineSection,
} from "@/components/public";

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

        <PublicRelatedLinksSection
          headingId="implementation-related-heading"
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
        testIdPrefix="cta.public.implementation"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
