import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const CASE_SLUGS = ["residential", "commercial", "infrastructure", "renovation"] as const;

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t0 = await getTranslations({ locale, namespace: "public.cases" });
  if (!CASE_SLUGS.includes(slug as (typeof CASE_SLUGS)[number])) {
    return { title: t0("title") };
  }
  const t = await getTranslations({ locale, namespace: "public.cases" });
  const titleKey = slug as (typeof CASE_SLUGS)[number];
  return {
    title: t(titleKey),
    description: t("metaDescription"),
  };
}

export default async function CaseSlugPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (!CASE_SLUGS.includes(slug as (typeof CASE_SLUGS)[number])) notFound();
  const t = await getTranslations("public.cases");
  const key = slug as (typeof CASE_SLUGS)[number];

  return (
    <div className="mx-auto min-w-0 max-w-3xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <Link
        href="/cases"
        className="text-[var(--aistroyka-font-footnote)] text-[var(--aistroyka-accent)] hover:underline"
      >
        ← {t("title")}
      </Link>
      <h1 className="mt-4 text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t(key)}
      </h1>
      <dl className="mt-8 space-y-4">
        <div>
          <dt className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-tertiary)]">
            {t("projectSize")}
          </dt>
          <dd className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
            {t(`${key}ProjectSize`)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-tertiary)]">
            {t("teamSize")}
          </dt>
          <dd className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
            {t(`${key}TeamSize`)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-tertiary)]">
            {t("timeline")}
          </dt>
          <dd className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
            {t(`${key}Timeline`)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-tertiary)]">
            {t("toolsUsed")}
          </dt>
          <dd className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
            {t(`${key}ToolsUsed`)}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--aistroyka-font-subheadline)] text-[var(--aistroyka-text-tertiary)]">
            {t("benefits")}
          </dt>
          <dd className="mt-1 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-primary)]">
            {t(`${key}Benefits`)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const slug of CASE_SLUGS) {
      params.push({ locale, slug });
    }
  }
  return params;
}
