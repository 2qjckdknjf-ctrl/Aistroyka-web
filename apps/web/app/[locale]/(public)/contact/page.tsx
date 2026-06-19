import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicPageHero,
  PublicTimelineSection,
} from "@/components/public";
import { ContactConversionVisual } from "./ContactConversionVisual";
import { ContactForm } from "./ContactForm";

type Props = { params: Promise<{ locale: string }> };

const PROCESS_KEYS = ["stepContact", "stepDiscovery", "stepPilotSetup", "stepTeamOnboarding", "stepLiveUsage"] as const;

const WHO_KEYS = [
  "whoContractors",
  "whoProjectManagers",
  "whoConstructionCompanies",
  "whoOwners",
  "whoMultiSite",
  "whoGrowingOps",
] as const;

const METHOD_KEYS = ["methodContactRequest", "methodPresentation", "methodPilotDiscussion"] as const;

const VISUAL_PILLAR_KEYS = [
  "visualPillarOnboarding",
  "visualPillarProjects",
  "visualPillarTeams",
  "visualPillarDeploy",
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.contact" });
  return buildPublicPageMetadata(locale, "/contact", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.contact");
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
          <ContactConversionVisual
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
        <PublicTimelineSection
          title={t("processTitle")}
          subtitle={t("processSubtitle")}
          steps={PROCESS_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
          }))}
        />

        <PublicFeatureGrid
          title={t("whoTitle")}
          subtitle={t("whoSubtitle")}
          columns={3}
          items={WHO_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicFeatureGrid
          title={t("methodsTitle")}
          subtitle={t("methodsSubtitle")}
          columns={3}
          headingLevel="h2"
          items={METHOD_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
            href: key === "methodPilotDiscussion" ? "/dashboard" : "#contact-form",
          }))}
        />

        <section id="contact-form" aria-labelledby="contact-form-heading" className="scroll-mt-24">
          <h2
            id="contact-form-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("formTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("formSubtitle")}
          </p>
          <div className="mt-8 rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface p-6 shadow-[var(--aistroyka-shadow-e1)]">
            <ContactForm />
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
        testIdPrefix="cta.public.contact"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
