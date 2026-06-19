import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { PublicCTASection, PublicFeatureGrid, PublicPageHero, PublicTimelineSection, PublicJsonLd } from "@/components/public";
import { AiControlSignalVisual } from "./AiControlSignalVisual";

type Props = { params: Promise<{ locale: string }> };

const INPUT_KEYS = [
  "inputPhotos",
  "inputDailyReports",
  "inputTasks",
  "inputSchedule",
  "inputDocuments",
  "inputEvidenceGaps",
] as const;

const PIPELINE_KEYS = ["stepIngest", "stepAnalyze", "stepFlag", "stepReview", "stepRecord"] as const;

const DETECTION_KEYS = [
  "detectMissingEvidence",
  "detectProgressDeviation",
  "detectRiskPatterns",
  "detectBlockedWork",
  "detectQualityConcerns",
  "detectReviewReady",
] as const;

const TRUST_KEYS = [
  "trustExplainable",
  "trustHumanApproval",
  "trustTenantContext",
  "trustNoAutomation",
] as const;

const VISUAL_SIGNAL_KEYS = [
  "visualSignalProgress",
  "visualSignalRisk",
  "visualSignalEvidence",
  "visualSignalReview",
] as const;

const RELATED_LINKS = [
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/mobile", titleKey: "relatedMobile", descKey: "relatedMobileDesc", linkKey: "linkMobile" },
  { href: "/copilot", titleKey: "relatedCopilot", descKey: "relatedCopilotDesc", linkKey: "linkCopilot" },
  { href: "/ai-demo", titleKey: "relatedAiDemo", descKey: "relatedAiDemoDesc", linkKey: "linkAiDemo" },
] as const;

const linkFocusClass =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.aiControl" });
  return buildPublicPageMetadata(locale, "/ai-construction-control", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function AiConstructionControlPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.aiControl");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/ai-construction-control",
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
          <AiControlSignalVisual
            label={t("visualLabel")}
            title={t("visualTitle")}
            caption={t("visualCaption")}
            signals={VISUAL_SIGNAL_KEYS.map((key) => ({
              label: t(key),
              detail: t(`${key}Detail`),
              tone: key === "visualSignalRisk" ? "warning" : "default",
            }))}
          />
        }
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("inputsTitle")}
          subtitle={t("inputsSubtitle")}
          columns={3}
          items={INPUT_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicTimelineSection
          title={t("pipelineTitle")}
          subtitle={t("pipelineSubtitle")}
          steps={PIPELINE_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <PublicFeatureGrid
          title={t("detectionTitle")}
          subtitle={t("detectionSubtitle")}
          columns={3}
          items={DETECTION_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "detectReviewReady" ? "glass-highlight" : "solid",
            eyebrow: key === "detectReviewReady" ? t("detectReviewReadyEyebrow") : undefined,
          }))}
        />

        <section aria-labelledby="ai-control-trust-heading">
          <h2
            id="ai-control-trust-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("trustTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("trustSubtitle")}
          </p>
          <div className="mt-8">
            <PublicFeatureGrid
              columns={2}
              headingLevel="h3"
              items={TRUST_KEYS.map((key) => ({
                title: t(key),
                description: t(`${key}Desc`),
                variant: "solid",
              }))}
            />
          </div>
        </section>

        <section aria-labelledby="ai-control-related-heading">
          <h2
            id="ai-control-related-heading"
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
                <Link
                  href={href}
                  className={`mt-4 inline-flex text-sm font-medium text-aistroyka-accent underline-offset-4 hover:underline ${linkFocusClass}`}
                >
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
        testIdPrefix="cta.public.ai-control"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
