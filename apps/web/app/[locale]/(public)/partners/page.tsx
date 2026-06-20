import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import {
  PublicCTASection,
  PublicJsonLd,
  PublicPageHero,
  PublicRelatedLinksSection,
  PublicRevealGlassCard,
} from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

const TYPES = ["type1", "type2", "type3", "type4"] as const;
const BENEFITS = ["benefit1", "benefit2", "benefit3", "benefit4"] as const;

const RELATED_LINKS = [
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/pricing", titleKey: "relatedPricing", descKey: "relatedPricingDesc", linkKey: "linkPricing" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
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
      <PublicPageHero
        variant="compact"
        eyebrow={t("eyebrow")}
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        ctas={false}
      />

      <div className="mx-auto min-w-0 max-w-7xl space-y-16 px-4 pb-8 sm:px-6 lg:px-8 lg:pb-12">
        <section className="mt-4" aria-labelledby="partners-types-heading">
          <h2
            id="partners-types-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("typesTitle")}
          </h2>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {TYPES.map((key) => (
              <PublicRevealGlassCard key={key} interactive intensity="subtle">
                {t(key)}
              </PublicRevealGlassCard>
            ))}
          </div>
        </section>

        <section aria-labelledby="partners-benefits-heading">
          <h2
            id="partners-benefits-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("benefitsTitle")}
          </h2>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {BENEFITS.map((key) => (
              <PublicRevealGlassCard key={key} interactive intensity="subtle">
                {t(key)}
              </PublicRevealGlassCard>
            ))}
          </div>
        </section>

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

      <PublicCTASection
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
