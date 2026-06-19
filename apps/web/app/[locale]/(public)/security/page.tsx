import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicPageHero,
  PublicProofSection,
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

const linkFocusClass =
  "font-medium text-aistroyka-accent underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

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
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function SecurityPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.security");
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
          <ul className="mt-8 grid min-w-0 gap-4 sm:grid-cols-3">
            {MATRIX_KEYS.map((key) => (
              <li
                key={key}
                className="rounded-[var(--aistroyka-radius-card)] border border-aistroyka-border-subtle bg-aistroyka-surface p-5 shadow-[var(--aistroyka-shadow-e1)]"
              >
                <h3 className="font-semibold text-aistroyka-text-primary">{t(`${key}Title`)}</h3>
                <p className="mt-2 text-[var(--aistroyka-font-footnote)] text-aistroyka-text-secondary">
                  {t(`${key}Desc`)}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="security-related-heading">
          <h2
            id="security-related-heading"
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
        testIdPrefix="cta.public.security"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
