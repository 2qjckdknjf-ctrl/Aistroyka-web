import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { GlassLink } from "@/components/design/liquid-glass";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicJsonLd,
  PublicPageHero,
  PublicRelatedLinksSection,
} from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

const CORE_KEYS = ["projects", "tasks", "dailyReports", "documentation"] as const;
const FIELD_KEYS = ["photos", "progressTracking", "siteRecords", "evidenceCollection"] as const;
const INTELLIGENCE_KEYS = ["constructionAi", "copilot"] as const;
const TEAM_KEYS = ["roles", "dashboards", "notifications", "stakeholders"] as const;
const CONNECTIVITY_KEYS = ["integrations", "exports", "api", "externalSystems"] as const;

const RELATED_LINKS = [
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/mobile", titleKey: "relatedMobile", descKey: "relatedMobileDesc", linkKey: "linkMobile" },
  {
    href: "/ai-construction-control",
    titleKey: "relatedConstructionAi",
    descKey: "relatedConstructionAiDesc",
    linkKey: "linkConstructionAi",
  },
  { href: "/copilot", titleKey: "relatedCopilot", descKey: "relatedCopilotDesc", linkKey: "linkCopilot" },
  {
    href: "/integrations",
    titleKey: "relatedIntegrations",
    descKey: "relatedIntegrationsDesc",
    linkKey: "linkIntegrations",
  },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.features" });
  return buildPublicPageMetadata(locale, "/features", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function FeaturesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.features");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/features",
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
        <PublicFeatureGrid
          title={t("coreOpsTitle")}
          subtitle={t("coreOpsSubtitle")}
          columns={2}
          items={CORE_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <div className="space-y-6">
          <PublicFeatureGrid
            title={t("fieldTitle")}
            subtitle={t("fieldSubtitle")}
            columns={2}
            items={FIELD_KEYS.map((key) => ({
              title: t(key),
              description: t(`${key}Desc`),
              variant: "solid",
            }))}
          />
          <p className="text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            <GlassLink href="/mobile" intensity="subtle" pill linkClassName="text-sm">
              {t("fieldCrossLink")}
            </GlassLink>
          </p>
        </div>

        <PublicFeatureGrid
          title={t("intelligenceTitle")}
          subtitle={t("intelligenceSubtitle")}
          columns={2}
          items={INTELLIGENCE_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: key === "constructionAi" ? "glass-highlight" : "solid",
            href: key === "constructionAi" ? "/ai-construction-control" : "/copilot",
            eyebrow: key === "constructionAi" ? t("constructionAiEyebrow") : undefined,
          }))}
        />

        <PublicFeatureGrid
          title={t("teamTitle")}
          subtitle={t("teamSubtitle")}
          columns={2}
          items={TEAM_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <div className="space-y-6">
          <PublicFeatureGrid
            title={t("connectivityTitle")}
            subtitle={t("connectivitySubtitle")}
            columns={2}
            items={CONNECTIVITY_KEYS.map((key) => ({
              title: t(key),
              description: t(`${key}Desc`),
              variant: "solid",
              href: key === "integrations" ? "/integrations" : key === "api" ? "/api" : undefined,
            }))}
          />
          <p className="text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            <GlassLink href="/integrations" intensity="subtle" pill linkClassName="text-sm">
              {t("connectivityCrossLink")}
            </GlassLink>
          </p>
        </div>

        <PublicRelatedLinksSection
          headingId="features-related-heading"
          title={t("relatedTitle")}
          subtitle={t("relatedSubtitle")}
          columns={5}
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
        testIdPrefix="cta.public.features"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
