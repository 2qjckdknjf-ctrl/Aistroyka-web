import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicGlassMatrixGrid,
  PublicJsonLd,
  PublicPageHero,
  PublicProofSection,
  PublicRelatedLinksSection,
} from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

type Readiness = "live" | "partial" | "planned";

const CATEGORIES: ReadonlyArray<{
  key: string;
  readiness: Readiness;
  href?: string;
  highlight?: boolean;
}> = [
  { key: "catMobile", readiness: "live", href: "/mobile" },
  { key: "catApi", readiness: "partial", href: "/api", highlight: true },
  { key: "catMessaging", readiness: "partial" },
  { key: "catProofExport", readiness: "live" },
  { key: "catStorage", readiness: "partial" },
  { key: "catErp", readiness: "planned" },
  { key: "catBim", readiness: "planned" },
  { key: "catDocs", readiness: "planned" },
  { key: "catWebhooks", readiness: "planned" },
  { key: "catAnalytics", readiness: "planned" },
];

const API_ECOSYSTEM_KEYS = ["apiRestV1", "apiMobileSync", "apiTenantScoped", "apiPublicProgram"] as const;
const IMPORT_EXPORT_KEYS = ["exportProofPacks", "exportProjectRecords", "exportStakeholderNotify", "exportErpBridge"] as const;
const MATRIX_KEYS = ["matrixLive", "matrixPartial", "matrixPlanned"] as const;

const RELATED_LINKS = [
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/api", titleKey: "relatedApi", descKey: "relatedApiDesc", linkKey: "linkApi" },
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/enterprise", titleKey: "relatedEnterprise", descKey: "relatedEnterpriseDesc", linkKey: "linkEnterprise" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

function statusKey(readiness: Readiness): "statusLive" | "statusPartial" | "statusPlanned" {
  switch (readiness) {
    case "live":
      return "statusLive";
    case "partial":
      return "statusPartial";
    case "planned":
      return "statusPlanned";
    default: {
      const _exhaustive: never = readiness;
      return _exhaustive;
    }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.integrations" });
  return buildPublicPageMetadata(locale, "/integrations", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function IntegrationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.integrations");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/integrations",
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
          title={t("categoriesTitle")}
          subtitle={t("categoriesSubtitle")}
          columns={2}
          items={CATEGORIES.map(({ key, readiness, href, highlight }) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: highlight ? "glass-highlight" : "solid",
            eyebrow: t(statusKey(readiness)),
            href,
          }))}
        />

        <section aria-labelledby="integrations-matrix-heading">
          <h2
            id="integrations-matrix-heading"
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
              stats={MATRIX_KEYS.map((key) => ({
                value: t(`${key}Value`),
                label: t(`${key}Label`),
              }))}
            />
          </div>
          <PublicGlassMatrixGrid
            items={MATRIX_KEYS.map((key) => ({
              title: t(`${key}Title`),
              description: t(`${key}Desc`),
            }))}
          />
        </section>

        <PublicFeatureGrid
          title={t("apiEcosystemTitle")}
          subtitle={t("apiEcosystemSubtitle")}
          columns={2}
          items={API_ECOSYSTEM_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
            href: key === "apiPublicProgram" ? "/contact" : "/api",
          }))}
        />

        <PublicFeatureGrid
          title={t("importExportTitle")}
          subtitle={t("importExportSubtitle")}
          columns={2}
          items={IMPORT_EXPORT_KEYS.map((key) => ({
            title: t(key),
            description: t(`${key}Desc`),
            variant: "solid",
          }))}
        />

        <PublicRelatedLinksSection
          headingId="integrations-related-heading"
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
        testIdPrefix="cta.public.integrations"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
