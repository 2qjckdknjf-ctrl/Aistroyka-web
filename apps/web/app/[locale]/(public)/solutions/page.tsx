import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import {
  PublicCTASection,
  PublicFeatureGrid,
  PublicJsonLd,
  PublicPageHero,
  PublicRelatedLinksSection,
  PublicRevealGlassCard,
} from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { PUBLIC_SOLUTION_ROLES } from "@/lib/platform/public-solutions-inventory";

type Props = { params: Promise<{ locale: string }> };

const RELATED_LINKS = [
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/pricing", titleKey: "relatedPricing", descKey: "relatedPricingDesc", linkKey: "linkPricing" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

function roleDescription(
  t: (key: string) => string,
  key: (typeof PUBLIC_SOLUTION_ROLES)[number]["key"],
): string {
  return [t(`${key}See`), t(`${key}Do`), t(`${key}Matter`)].join(" ");
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.solutions" });
  return buildPublicPageMetadata(locale, "/solutions", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.solutions");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/solutions",
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
          title={t("rolesTitle")}
          subtitle={t("rolesSubtitle")}
          columns={2}
          items={PUBLIC_SOLUTION_ROLES.map(({ key, highlight }) => ({
            title: t(`${key}Title`),
            description: roleDescription(t, key),
            variant: highlight ? "glass-highlight" : "solid",
            eyebrow: t(`${key}Eyebrow`),
          }))}
        />

        <PublicRelatedLinksSection
          headingId="solutions-related-heading"
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
        testIdPrefix="cta.public.solutions"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
