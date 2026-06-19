import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PublicCTASection, PublicRelatedLinksSection } from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";

type Props = { params: Promise<{ locale: string }> };

const RELATED_LINKS = [
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/platform", titleKey: "relatedPlatform", descKey: "relatedPlatformDesc", linkKey: "linkPlatform" },
  { href: "/pricing", titleKey: "relatedPricing", descKey: "relatedPricingDesc", linkKey: "linkPricing" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

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

  const solutions = [
    "forDeveloper",
    "forGeneralContractor",
    "forContractor",
    "forProjectManager",
    "forFieldTeams",
  ] as const;

  return (
    <>
      <div className="mx-auto min-w-0 max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
          {t("heroSubtitle")}
        </p>
        <div className="mt-12 space-y-8">
          {solutions.map((key) => (
            <div
              key={key}
              className="card rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
            >
              <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
                {t(key)}
              </h2>
              <p className="mt-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
                {t(`${key}Desc`)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16">
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
