import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicPageHero,
  PublicProofSection,
  PublicRelatedLinksSection,
  PublicTimelineSection,
} from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { MobileWorkflowVisual } from "./MobileWorkflowVisual";

type Props = { params: Promise<{ locale: string }> };

const REPORTING_KEYS = [
  "wfStartWork",
  "wfDailyReport",
  "wfBeforePhotos",
  "wfAfterPhotos",
  "wfUploadSync",
  "wfSubmitReport",
] as const;

const MANAGER_KEYS = [
  "mgrInbox",
  "mgrReview",
  "mgrApprove",
  "mgrRequestChanges",
  "mgrTrackProgress",
  "mgrProjectVisibility",
] as const;

const TIMELINE_KEYS = [
  "stepWorker",
  "stepReport",
  "stepPhotos",
  "stepUpload",
  "stepReview",
  "stepApproval",
  "stepRecord",
] as const;

const PROOF_KEYS = ["proofStat1", "proofStat2", "proofStat3"] as const;

const RELATED_LINKS = [
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/ai-construction-control", titleKey: "relatedAiControl", descKey: "relatedAiControlDesc", linkKey: "linkAiControl" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

const VISUAL_LAYER_KEYS = ["visualLayerWorker", "visualLayerPhotos", "visualLayerSync", "visualLayerReview"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.mobile" });
  return buildPublicPageMetadata(locale, "/mobile", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function MobilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.mobile");
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
          <MobileWorkflowVisual
            label={t("visualLabel")}
            title={t("visualTitle")}
            layers={VISUAL_LAYER_KEYS.map((key) => ({
              label: t(key),
              detail: t(`${key}Detail`),
            }))}
          />
        }
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("reportingTitle")}
          subtitle={t("reportingSubtitle")}
          columns={3}
          items={REPORTING_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "wfDailyReport" ? "glass-highlight" : "solid",
            eyebrow: key === "wfDailyReport" ? t("wfDailyReportEyebrow") : undefined,
          }))}
        />

        <PublicFeatureGrid
          title={t("managerTitle")}
          subtitle={t("managerSubtitle")}
          columns={3}
          headingLevel="h2"
          items={MANAGER_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicTimelineSection
          title={t("timelineTitle")}
          subtitle={t("timelineSubtitle")}
          steps={TIMELINE_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <section aria-labelledby="mobile-proof-heading">
          <h2
            id="mobile-proof-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("proofTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("proofSubtitle")}
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
          headingId="mobile-related-heading"
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
        testIdPrefix="cta.public.mobile"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
