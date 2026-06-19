import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicJsonLd,
  PublicPageHero,
  PublicRelatedLinksSection,
  PublicTimelineSection,
} from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import {
  PUBLIC_WORKFLOW_LIVE_KEYS,
  PUBLIC_WORKFLOW_PATHS,
  PUBLIC_WORKFLOW_ROADMAP_KEYS,
  PUBLIC_WORKFLOW_TIMELINE_KEYS,
  publicWorkflowStatusKey,
} from "@/lib/platform/public-workflows-inventory";

type Props = { params: Promise<{ locale: string }> };

const RELATED_LINKS = [
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/mobile", titleKey: "relatedMobile", descKey: "relatedMobileDesc", linkKey: "linkMobile" },
  { href: "/ai-construction-control", titleKey: "relatedAiControl", descKey: "relatedAiControlDesc", linkKey: "linkAiControl" },
  { href: "/implementation", titleKey: "relatedImplementation", descKey: "relatedImplementationDesc", linkKey: "linkImplementation" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.workflows" });
  return buildPublicPageMetadata(locale, "/workflows", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function WorkflowsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.workflows");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/workflows",
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
        <p className="-mt-8 max-w-3xl rounded-[var(--aistroyka-radius-lg)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-bg-primary)] px-4 py-3 text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-text-secondary)]">
          {t("positioning")}
        </p>

        <PublicFeatureGrid
          title={t("matrixTitle")}
          subtitle={t("matrixSubtitle")}
          columns={2}
          items={PUBLIC_WORKFLOW_PATHS.map(({ key, readiness, highlight }) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: highlight ? "glass-highlight" : "solid",
            eyebrow: t(publicWorkflowStatusKey(readiness)),
          }))}
        />

        <PublicTimelineSection
          headingLevel="h2"
          title={t("timelineTitle")}
          subtitle={t("timelineSubtitle")}
          steps={PUBLIC_WORKFLOW_TIMELINE_KEYS.map(({ key, readiness }) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            status: t(publicWorkflowStatusKey(readiness)),
          }))}
        />

        <PublicFeatureGrid
          headingLevel="h2"
          title={t("liveTitle")}
          subtitle={t("liveSubtitle")}
          columns={2}
          items={PUBLIC_WORKFLOW_LIVE_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            variant: "solid",
            eyebrow: t("statusLive"),
          }))}
        />

        <PublicFeatureGrid
          headingLevel="h2"
          title={t("roadmapTitle")}
          subtitle={t("roadmapSubtitle")}
          columns={2}
          items={PUBLIC_WORKFLOW_ROADMAP_KEYS.map(({ key, readiness }) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            variant: "solid",
            eyebrow: t(publicWorkflowStatusKey(readiness)),
          }))}
        />

        <PublicRelatedLinksSection
          headingId="workflows-related-heading"
          title={t("relatedTitle")}
          subtitle={t("relatedSubtitle")}
          columns={3}
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
        testIdPrefix="cta.public.workflows"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
