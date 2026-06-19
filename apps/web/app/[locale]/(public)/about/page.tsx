import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PublicCTASection, PublicFeatureGrid, PublicPageHero, PublicProofSection, PublicRelatedLinksSection, PublicTimelineSection, PublicJsonLd } from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { AboutTrustVisual } from "./AboutTrustVisual";

type Props = { params: Promise<{ locale: string }> };

const PROBLEM_KEYS = [
  "probScatteredComm",
  "probMissingAccountability",
  "probDelayedReporting",
  "probPoorVisibility",
  "probDocumentChaos",
  "probReactiveDecisions",
] as const;

const WHY_KEYS = [
  "whyOneRecord",
  "whyFieldToOffice",
  "whyStructuredReporting",
  "whyEvidenceFirst",
  "whyAiAssistedReview",
  "whyDecisionSupport",
] as const;

const PRINCIPLE_KEYS = [
  "principleEvidence",
  "principleHumanAccountability",
  "principleVisibility",
  "principleConstructionWorkflows",
  "principleContinuousImprovement",
] as const;

const PROOF_KEYS = ["proofStat1", "proofStat2", "proofStat3"] as const;

const VISUAL_PILLAR_KEYS = [
  "visualPillarVisibility",
  "visualPillarAccountability",
  "visualPillarEvidence",
  "visualPillarDecisions",
] as const;

const RELATED_LINKS = [
  { href: "/security", titleKey: "relatedSecurity", descKey: "relatedSecurityDesc", linkKey: "linkSecurity" },
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/faq", titleKey: "relatedFaq", descKey: "relatedFaqDesc", linkKey: "linkFaq" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.about" });
  return buildPublicPageMetadata(locale, "/about", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.about");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/about",
    t("title"),
    tLayout("breadcrumbHome"),
  );

  return (
    <>
      <PublicJsonLd data={breadcrumbJsonLd} />
      <PublicPageHero
        variant="split-visual"
        eyebrow={t("eyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        ctas={false}
        visual={
          <AboutTrustVisual
            label={t("visualLabel")}
            title={t("visualTitle")}
            pillars={VISUAL_PILLAR_KEYS.map((key) => ({
              label: t(key),
              detail: t(`${key}Detail`),
            }))}
          />
        }
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("problemTitle")}
          subtitle={t("problemSubtitle")}
          columns={3}
          items={PROBLEM_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicFeatureGrid
          title={t("whyTitle")}
          subtitle={t("whySubtitle")}
          columns={3}
          headingLevel="h2"
          items={WHY_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "whyOneRecord" ? "glass-highlight" : "solid",
            eyebrow: key === "whyOneRecord" ? t("whyOneRecordEyebrow") : undefined,
          }))}
        />

        <PublicTimelineSection
          title={t("principlesTitle")}
          subtitle={t("principlesSubtitle")}
          steps={PRINCIPLE_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <section aria-labelledby="about-trust-heading">
          <h2
            id="about-trust-heading"
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
              stats={PROOF_KEYS.map((key) => ({
                value: t(`${key}Value`),
                label: t(`${key}Label`),
              }))}
            />
          </div>
        </section>

        <PublicRelatedLinksSection
          headingId="about-related-heading"
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
        testIdPrefix="cta.public.about"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
