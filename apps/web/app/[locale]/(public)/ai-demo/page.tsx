import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";
import { GlassLink } from "@/components/design/liquid-glass";
import { GlassSurface } from "@/components/design/liquid-glass";
import { PublicCTASection, PublicPageHero, PublicJsonLd, PublicRelatedLinksSection } from "@/components/public";
import { AiDemoSimulator } from "./AiDemoSimulator";

type Props = { params: Promise<{ locale: string }> };

const RELATED_LINKS = [
  {
    href: "/ai-construction-control",
    titleKey: "relatedAiControl",
    descKey: "relatedAiControlDesc",
    linkKey: "linkAiControl",
  },
  { href: "/copilot", titleKey: "relatedCopilot", descKey: "relatedCopilotDesc", linkKey: "linkCopilot" },
  { href: "/features", titleKey: "relatedFeatures", descKey: "relatedFeaturesDesc", linkKey: "linkFeatures" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.aiDemo" });
  return buildPublicPageMetadata(locale, "/ai-demo", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function AiDemoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.aiDemo");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/ai-demo",
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
        <div className="flex justify-center">
          <GlassLink href="#demo">{t("openSimulator")}</GlassLink>
        </div>

        <section id="demo" aria-labelledby="ai-demo-simulator-heading">
          <h2
            id="ai-demo-simulator-heading"
            className="text-[var(--aistroyka-font-title2)] font-semibold text-aistroyka-text-primary"
          >
            {t("simulatorTitle")}
          </h2>
          <p className="mt-3 max-w-3xl text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
            {t("simulatorSubtitle")}
          </p>
          <div className="mt-8">
            <GlassSurface intensity="subtle" padding="md" reveal motion={["interactive"]}>
              <AiDemoSimulator embedded />
            </GlassSurface>
          </div>
        </section>

        <PublicRelatedLinksSection
          headingId="ai-demo-related-heading"
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
        testIdPrefix="cta.public.aiDemo"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
