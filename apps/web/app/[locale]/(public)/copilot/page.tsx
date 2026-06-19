import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicPageHero,
  PublicRelatedLinksSection,
  PublicTimelineSection,
} from "@/components/public";
import { CopilotInsightVisual } from "./CopilotInsightVisual";

type Props = { params: Promise<{ locale: string }> };

const HELP_KEYS = [
  "helpSummarizeReports",
  "helpSurfaceRisks",
  "helpMissingEvidence",
  "helpManagerDecisions",
  "helpFollowUps",
  "helpLearnCorrections",
] as const;

const TIMELINE_KEYS = [
  "stepReports",
  "stepEvidence",
  "stepAnalysis",
  "stepAnswer",
  "stepReview",
  "stepDecisions",
] as const;

const GUARD_KEYS = [
  "guardTenantContext",
  "guardHumanReview",
  "guardNoBlindAutomation",
  "guardExplainableOutputs",
  "guardConstructionSignals",
] as const;

const VISUAL_SIGNAL_KEYS = [
  "visualSignalReports",
  "visualSignalRisks",
  "visualSignalEvidence",
  "visualSignalSchedule",
] as const;

const RELATED_LINKS = [
  { href: "/ai-construction-control", titleKey: "relatedAiControl", descKey: "relatedAiControlDesc", linkKey: "linkAiControl" },
  { href: "/ai-demo", titleKey: "relatedAiDemo", descKey: "relatedAiDemoDesc", linkKey: "linkAiDemo" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.copilot" });
  return buildPublicPageMetadata(locale, "/copilot", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function CopilotPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.copilot");
  const tCta = await getTranslations("public.cta");

  return (
    <>
      <PublicPageHero
        variant="split-visual"
        eyebrow={t("eyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        ctas={false}
        visual={
          <CopilotInsightVisual
            label={t("visualLabel")}
            title={t("visualTitle")}
            prompt={t("visualPrompt")}
            signals={VISUAL_SIGNAL_KEYS.map((key) => ({
              label: t(key),
              detail: t(`${key}Detail`),
            }))}
          />
        }
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("helpsTitle")}
          subtitle={t("helpsSubtitle")}
          columns={3}
          items={HELP_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "helpSummarizeReports" ? "glass-highlight" : "solid",
            eyebrow: key === "helpSummarizeReports" ? t("helpSummarizeReportsEyebrow") : undefined,
          }))}
        />

        <PublicTimelineSection
          title={t("howTitle")}
          subtitle={t("howSubtitle")}
          steps={TIMELINE_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <PublicFeatureGrid
          title={t("trustTitle")}
          subtitle={t("trustSubtitle")}
          columns={3}
          headingLevel="h2"
          items={GUARD_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />
      </div>

      <div className="mx-auto min-w-0 max-w-7xl px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicRelatedLinksSection
          headingId="copilot-related-heading"
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
        testIdPrefix="cta.public.copilot"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
