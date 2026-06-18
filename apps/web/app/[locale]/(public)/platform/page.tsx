import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicPageHero,
  PublicProofSection,
  PublicTimelineSection,
} from "@/components/public";
import { PlatformStackVisual } from "./PlatformStackVisual";

type Props = { params: Promise<{ locale: string }> };

const CAPABILITY_KEYS = [
  "capProjectControl",
  "capFieldReporting",
  "capDocumentsApprovals",
  "capConstructionAi",
  "capTeamCoordination",
  "capOwnerVisibility",
] as const;

const TIMELINE_KEYS = ["stepWorkers", "stepReports", "stepManagers", "stepAi", "stepDecisions", "stepVisibility"] as const;

const PROOF_KEYS = ["proofStat1", "proofStat2", "proofStat3"] as const;

const VISUAL_LAYER_KEYS = ["visualLayerWeb", "visualLayerMobile", "visualLayerAi", "visualLayerNotify"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.platform" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function PlatformPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.platform");
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
          <PlatformStackVisual
            label={t("visualLabel")}
            title={t("visualTitle")}
            layers={VISUAL_LAYER_KEYS.map((key) => ({
              label: t(`${key}`),
              detail: t(`${key}Detail`),
            }))}
          />
        }
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("capabilitiesTitle")}
          subtitle={t("capabilitiesSubtitle")}
          columns={3}
          items={CAPABILITY_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "capConstructionAi" ? "glass-highlight" : "solid",
            href:
              key === "capFieldReporting"
                ? "/mobile"
                : key === "capConstructionAi"
                  ? "/ai-construction-control"
                  : undefined,
            eyebrow: key === "capConstructionAi" ? t("capConstructionAiEyebrow") : undefined,
          }))}
        />

        <PublicTimelineSection
          title={t("howItWorksTitle")}
          subtitle={t("howItWorksSubtitle")}
          steps={TIMELINE_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <section aria-labelledby="platform-proof-heading">
          <h2
            id="platform-proof-heading"
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
      </div>

      <PublicCTASection
        variant="floating"
        title={t("ctaTitle")}
        subtitle={t("ctaSubtitle")}
        primaryLabel={tCta("launchPilot")}
        secondaryLabel={tCta("contactUs")}
        presentationLabel={tCta("getPresentation")}
        testIdPrefix="cta.public.platform"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
