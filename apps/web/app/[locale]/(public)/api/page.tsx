import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { GlassSurface } from "@/components/design/liquid-glass";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicGlassMatrixGrid,
  PublicJsonLd,
  PublicPageHero,
  PublicProofSection,
  PublicRelatedLinksSection,
  PublicRevealGlassCard,
  PublicTimelineSection,
} from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import {
  PUBLIC_API_AUTH_KEYS,
  PUBLIC_API_CATEGORIES,
  PUBLIC_API_EXAMPLE_ROUTES,
  PUBLIC_API_JOURNEY_KEYS,
  PUBLIC_API_MATRIX_KEYS,
  publicApiStatusKey,
} from "@/lib/platform/public-api-inventory";

type Props = { params: Promise<{ locale: string }> };

const RELATED_LINKS = [
  { href: "/integrations", titleKey: "relatedIntegrations", descKey: "relatedIntegrationsDesc", linkKey: "linkIntegrations" },
  { href: "/security", titleKey: "relatedSecurity", descKey: "relatedSecurityDesc", linkKey: "linkSecurity" },
  { href: "/enterprise", titleKey: "relatedEnterprise", descKey: "relatedEnterpriseDesc", linkKey: "linkEnterprise" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.api" });
  return buildPublicPageMetadata(locale, "/api", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function ApiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.api");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/api",
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
        <PublicRevealGlassCard intensity="subtle" className="-mt-8 max-w-3xl">
          <p className="text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">{t("positioning")}</p>
        </PublicRevealGlassCard>

        <PublicFeatureGrid
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
          columns={2}
          items={PUBLIC_API_CATEGORIES.map(({ key, readiness }) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: readiness === "live" ? "glass-highlight" : "solid",
            eyebrow: t(publicApiStatusKey(readiness)),
          }))}
        />

        <PublicFeatureGrid
          title={t("authTitle")}
          subtitle={t("authSubtitle")}
          columns={2}
          items={PUBLIC_API_AUTH_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicTimelineSection
          headingLevel="h2"
          title={t("journeyTitle")}
          subtitle={t("journeySubtitle")}
          steps={PUBLIC_API_JOURNEY_KEYS.map((key) => ({
            title: t(`${key}Title`),
            description: t(`${key}Desc`),
            status: t(`${key}Status`),
          }))}
        />

        <section aria-labelledby="api-matrix-heading">
          <h2
            id="api-matrix-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("matrixTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("matrixSubtitle")}
          </p>
          <div className="mt-8">
            <PublicProofSection
              variant="stat-row"
              stats={PUBLIC_API_MATRIX_KEYS.map((key) => ({
                value: t(`${key}Value`),
                label: t(`${key}Label`),
              }))}
            />
          </div>
          <PublicGlassMatrixGrid
            items={PUBLIC_API_MATRIX_KEYS.map((key) => ({
              title: t(`${key}Title`),
              description: t(`${key}Desc`),
            }))}
          />
        </section>

        <section aria-labelledby="api-examples-heading">
          <h2
            id="api-examples-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("examplesTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("examplesNote")}
          </p>
          <GlassSurface intensity="subtle" padding="md" reveal className="mt-6">
            <pre className="overflow-x-auto text-[var(--aistroyka-font-footnote)] text-aistroyka-text-primary">
              {PUBLIC_API_EXAMPLE_ROUTES.join("\n")}
            </pre>
          </GlassSurface>
        </section>

        <PublicRelatedLinksSection
          headingId="api-related-heading"
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
        testIdPrefix="cta.public.api"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
