import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { PublicCTASection, PublicJsonLd, PublicRelatedLinksSection } from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

const TYPES = ["type1", "type2", "type3", "type4"] as const;
const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

const RELATED_LINKS = [
  { href: "/implementation", titleKey: "relatedImplementation", descKey: "relatedImplementationDesc", linkKey: "linkImplementation" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
  { href: "/integrations", titleKey: "relatedIntegrations", descKey: "relatedIntegrationsDesc", linkKey: "linkIntegrations" },
  { href: "/enterprise", titleKey: "relatedEnterprise", descKey: "relatedEnterpriseDesc", linkKey: "linkEnterprise" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.partners" });
  return buildPublicPageMetadata(locale, "/partners", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function PartnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.partners");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/partners",
    t("title"),
    tLayout("breadcrumbHome"),
  );

  return (
    <>
      <PublicJsonLd data={breadcrumbJsonLd} />
      <div className="mx-auto min-w-0 max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <section className="text-center">
          <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
            {t("title")}
          </h1>
          <p className="mt-4 text-lg text-[var(--aistroyka-text-secondary)]">{t("heroTitle")}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("typesTitle")}
          </h2>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {TYPES.map((key) => (
              <div
                key={key}
                className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
              >
                {t(key)}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("benefitsTitle")}
          </h2>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {BENEFITS.map((key) => (
              <div
                key={key}
                className="rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
              >
                {t(key)}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-16">
          <PublicRelatedLinksSection
            headingId="partners-related-heading"
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
      </div>

      <PublicCTASection
        variant="floating"
        title={t("ctaTitle")}
        subtitle={t("ctaSubtitle")}
        primaryLabel={tCta("launchPilot")}
        secondaryLabel={tCta("contactUs")}
        presentationLabel={tCta("getPresentation")}
        testIdPrefix="cta.public.partners"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
