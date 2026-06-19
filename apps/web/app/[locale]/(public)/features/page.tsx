import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { PublicCTASection, PublicFeatureGrid, PublicPageHero } from "@/components/public";

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

const linkFocusClass =
  "font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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

  return (
    <>
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
            <Link href="/mobile" className={linkFocusClass}>
              {t("fieldCrossLink")}
            </Link>
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
            <Link href="/integrations" className={linkFocusClass}>
              {t("connectivityCrossLink")}
            </Link>
          </p>
        </div>

        <section aria-labelledby="features-related-heading">
          <h2
            id="features-related-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("relatedTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("relatedSubtitle")}
          </p>
          <ul className="mt-8 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {RELATED_LINKS.map(({ href, titleKey, descKey, linkKey }) => (
              <li
                key={href}
                className="rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface p-5 shadow-[var(--aistroyka-shadow-e1)]"
              >
                <h3 className="font-semibold text-aistroyka-text-primary">{t(titleKey)}</h3>
                <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                  {t(descKey)}
                </p>
                <Link href={href} className={`mt-4 inline-flex text-sm ${linkFocusClass}`}>
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
        testIdPrefix="cta.public.features"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
