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

type SectionItem = {
  key: string;
  readiness: Readiness;
  href?: string;
  highlight?: boolean;
};

const DATA_PROTECTION: ReadonlyArray<SectionItem> = [
  { key: "dataTls", readiness: "live" },
  { key: "dataAtRest", readiness: "partial" },
  { key: "dataTenantIsolation", readiness: "live", highlight: true },
  { key: "dataStakeholderFinance", readiness: "live" },
  { key: "dataMediaStorage", readiness: "live" },
  { key: "dataEdgeDelivery", readiness: "live" },
];

const ACCESS_CONTROL: ReadonlyArray<SectionItem> = [
  { key: "accessRoles", readiness: "live" },
  { key: "accessRls", readiness: "live" },
  { key: "accessApiTenant", readiness: "live", href: "/api" },
  { key: "accessStakeholderPortal", readiness: "live" },
  { key: "accessAuthProviders", readiness: "partial" },
  { key: "accessSso", readiness: "planned" },
];

const AI_GOVERNANCE: ReadonlyArray<SectionItem> = [
  { key: "aiHumanReview", readiness: "live", href: "/ai-construction-control" },
  { key: "aiNoSilentChanges", readiness: "live" },
  { key: "aiTrainingOptIn", readiness: "live" },
  { key: "aiQuotas", readiness: "partial" },
  { key: "aiFlywheelGates", readiness: "partial" },
];

const AUDITABILITY: ReadonlyArray<SectionItem> = [
  { key: "auditEventTrail", readiness: "partial" },
  { key: "auditAiActions", readiness: "live" },
  { key: "auditConsentChanges", readiness: "live" },
  { key: "auditOwnerCabinet", readiness: "live" },
  { key: "auditComplianceCerts", readiness: "planned" },
];

const MATRIX_KEYS = ["matrixLive", "matrixPartial", "matrixPlanned"] as const;

const RELATED_LINKS = [
  { href: "/enterprise", titleKey: "relatedEnterprise", descKey: "relatedEnterpriseDesc", linkKey: "linkEnterprise" },
  { href: "/faq", titleKey: "relatedFaq", descKey: "relatedFaqDesc", linkKey: "linkFaq" },
  {
    href: "/ai-construction-control",
    titleKey: "relatedAiControl",
    descKey: "relatedAiControlDesc",
    linkKey: "linkAiControl",
  },
  { href: "/about", titleKey: "relatedAbout", descKey: "relatedAboutDesc", linkKey: "linkAbout" },
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

function toGridItems(
  items: ReadonlyArray<SectionItem>,
  t: Awaited<ReturnType<typeof getTranslations>>
) {
  return items.map(({ key, readiness, href, highlight }) => ({
    title: t(key),
    description: t(`${key}Desc`),
    variant: highlight ? ("glass-highlight" as const) : ("solid" as const),
    eyebrow: t(statusKey(readiness)),
    href,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.security" });
  return buildPublicPageMetadata(locale, "/security", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function SecurityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.security");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/security",
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
          title={t("dataProtectionTitle")}
          subtitle={t("dataProtectionSubtitle")}
          columns={2}
          items={toGridItems(DATA_PROTECTION, t)}
        />

        <PublicFeatureGrid
          title={t("accessControlTitle")}
          subtitle={t("accessControlSubtitle")}
          columns={2}
          items={toGridItems(ACCESS_CONTROL, t)}
        />

        <PublicFeatureGrid
          title={t("aiGovernanceTitle")}
          subtitle={t("aiGovernanceSubtitle")}
          columns={2}
          items={toGridItems(AI_GOVERNANCE, t)}
        />

        <PublicFeatureGrid
          title={t("auditabilityTitle")}
          subtitle={t("auditabilitySubtitle")}
          columns={2}
          items={toGridItems(AUDITABILITY, t)}
        />

        <section aria-labelledby="security-readiness-heading">
          <h2
            id="security-readiness-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("readinessTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("readinessSubtitle")}
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

        <PublicRelatedLinksSection
          headingId="security-related-heading"
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
        testIdPrefix="cta.public.security"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
