import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { PublicGlassContentPage, PublicRevealGlassCard } from "@/components/public";

type Props = { params: Promise<{ locale: string }> };

const CASE_SLUGS = ["residential", "commercial", "infrastructure", "renovation"] as const;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.cases" });
  return {
    title: t("title"),
    description: t("metaDescription"),
  };
}

export default async function CasesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.cases");

  return (
    <PublicGlassContentPage title={t("title")} description={t("metaDescription")} maxWidthClass="max-w-5xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {CASE_SLUGS.map((slug) => {
          const titleKey = slug as "residential" | "commercial" | "infrastructure" | "renovation";
          return (
            <Link
              key={slug}
              href={`/cases/${slug}`}
              className="block rounded-[var(--aistroyka-radius-card)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--aistroyka-focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            >
              <PublicRevealGlassCard interactive>
                <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-aistroyka-text-primary">
                  {t(titleKey)}
                </h2>
                <dl className="mt-4 space-y-2 text-[var(--aistroyka-font-footnote)]">
                  <div>
                    <dt className="text-aistroyka-text-tertiary">{t("projectSize")}</dt>
                    <dd className="text-aistroyka-text-primary">{t(`${slug}ProjectSize`)}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">{t("teamSize")}</dt>
                    <dd className="text-aistroyka-text-primary">{t(`${slug}TeamSize`)}</dd>
                  </div>
                  <div>
                    <dt className="text-aistroyka-text-tertiary">{t("timeline")}</dt>
                    <dd className="text-aistroyka-text-primary">{t(`${slug}Timeline`)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-[var(--aistroyka-font-body)] text-aistroyka-text-secondary">
                  {t(`${slug}Benefits`)}
                </p>
              </PublicRevealGlassCard>
            </Link>
          );
        })}
      </div>
    </PublicGlassContentPage>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
