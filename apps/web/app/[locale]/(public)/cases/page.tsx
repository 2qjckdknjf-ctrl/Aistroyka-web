import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

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
    <div className="mx-auto min-w-0 max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {CASE_SLUGS.map((slug) => {
          const titleKey = slug as "residential" | "commercial" | "infrastructure" | "renovation";
          return (
            <Link
              key={slug}
              href={`/cases/${slug}`}
              className="card block rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)] transition-shadow hover:shadow-[var(--aistroyka-shadow-e2)]"
            >
              <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
                {t(titleKey)}
              </h2>
              <dl className="mt-4 space-y-2 text-[var(--aistroyka-font-footnote)]">
                <div>
                  <dt className="text-[var(--aistroyka-text-tertiary)]">{t("projectSize")}</dt>
                  <dd className="text-[var(--aistroyka-text-primary)]">{t(`${slug}ProjectSize`)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--aistroyka-text-tertiary)]">{t("teamSize")}</dt>
                  <dd className="text-[var(--aistroyka-text-primary)]">{t(`${slug}TeamSize`)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--aistroyka-text-tertiary)]">{t("timeline")}</dt>
                  <dd className="text-[var(--aistroyka-text-primary)]">{t(`${slug}Timeline`)}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
                {t(`${slug}Benefits`)}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
