import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PublicCTASection, PublicFeatureGrid, PublicPageHero } from "@/components/public";
import { FaqVisual } from "./FaqVisual";

type Props = { params: Promise<{ locale: string }> };

const CORE_KEYS = [
  "coreWhatIs",
  "coreWhoFor",
  "coreWorkerTraining",
  "coreIosAndroid",
  "coreReporting",
  "coreAiManagers",
] as const;

const OPS_KEYS = [
  "opsImplementation",
  "opsActiveProjects",
  "opsApprovals",
  "opsInternet",
  "opsManagerReview",
  "opsOwnerProgress",
] as const;

const TRUST_KEYS = ["trustDataVisibility", "trustAccessControl", "trustAiAutonomous", "trustHumanReview"] as const;

const VISUAL_TOPIC_KEYS = ["visualTopicCore", "visualTopicOps", "visualTopicTrust"] as const;

function faqItems(keys: readonly string[], t: (key: string) => string) {
  return keys.map((key) => ({
    title: t(`${key}Q`),
    description: t(`${key}A`),
    variant: "faq" as const,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.faq" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function FaqPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.faq");
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
          <FaqVisual
            label={t("visualLabel")}
            title={t("visualTitle")}
            topics={VISUAL_TOPIC_KEYS.map((key) => ({
              label: t(key),
              detail: t(`${key}Detail`),
            }))}
          />
        }
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-20 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <PublicFeatureGrid
          title={t("coreTitle")}
          subtitle={t("coreSubtitle")}
          columns={2}
          items={faqItems(CORE_KEYS, t)}
        />

        <PublicFeatureGrid
          title={t("opsTitle")}
          subtitle={t("opsSubtitle")}
          columns={2}
          headingLevel="h2"
          items={faqItems(OPS_KEYS, t)}
        />

        <PublicFeatureGrid
          title={t("trustTitle")}
          subtitle={t("trustSubtitle")}
          columns={2}
          headingLevel="h2"
          items={faqItems(TRUST_KEYS, t)}
        />
      </div>

      <PublicCTASection
        variant="floating"
        title={t("ctaTitle")}
        subtitle={t("ctaSubtitle")}
        primaryLabel={tCta("launchPilot")}
        secondaryLabel={tCta("contactUs")}
        presentationLabel={tCta("getPresentation")}
        testIdPrefix="cta.public.faq"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
