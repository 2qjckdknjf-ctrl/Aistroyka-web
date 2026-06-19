import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";
import { PublicCTASection, PublicJsonLd, PublicRelatedLinksSection } from "@/components/public";
import { buildPublicPageMetadata } from "@/lib/seo/public-page-metadata";
import { buildStandardPublicBreadcrumb } from "@/lib/seo/public-page-breadcrumb";

type Props = { params: Promise<{ locale: string }> };

const EXAMPLES = ["ex1", "ex2", "ex3", "ex4", "ex5"] as const;
const BENEFITS = ["b1", "b2", "b3", "b4"] as const;

const RELATED_LINKS = [
  { href: "/ai-construction-control", titleKey: "relatedAiControl", descKey: "relatedAiControlDesc", linkKey: "linkAiControl" },
  { href: "/mobile", titleKey: "relatedMobile", descKey: "relatedMobileDesc", linkKey: "linkMobile" },
  { href: "/implementation", titleKey: "relatedImplementation", descKey: "relatedImplementationDesc", linkKey: "linkImplementation" },
  { href: "/contact", titleKey: "relatedContact", descKey: "relatedContactDesc", linkKey: "linkContact" },
] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.workflows" });
  return buildPublicPageMetadata(locale, "/workflows", {
    title: t("title"),
    description: t("metaDescription"),
  });
}

export default async function WorkflowsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.workflows");
  const tCta = await getTranslations("public.cta");
  const tLayout = await getTranslations("public.layout");
  const breadcrumbJsonLd = buildStandardPublicBreadcrumb(
    locale,
    "/workflows",
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
          <p className="mx-auto mt-4 max-w-3xl text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
            {t("positioning")}
          </p>
        </section>

        <section className="mt-12">
          <h2 className="text-[var(--aistroyka-font-title2)] font-semibold text-[var(--aistroyka-text-primary)]">
            {t("examplesTitle")}
          </h2>
          <div className="mt-6 space-y-4">
            {EXAMPLES.map((key) => (
              <div
                key={key}
                className="flex min-w-0 items-start gap-4 rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--aistroyka-accent-light)] text-[var(--aistroyka-font-footnote)] font-semibold text-[var(--aistroyka-accent)]">
                  →
                </span>
                <span className="min-w-0 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
                  {t(key)}
                </span>
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
            headingId="workflows-related-heading"
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
        testIdPrefix="cta.public.workflows"
      />
    </>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
