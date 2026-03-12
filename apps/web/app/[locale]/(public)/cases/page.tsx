import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

const CASE_SLUGS = ["residential", "commercial", "infrastructure", "renovation"] as const;

const CASE_DATA: Record<
  (typeof CASE_SLUGS)[number],
  { projectSize: string; teamSize: string; timeline: string; tools: string; benefits: string }
> = {
  residential: {
    projectSize: "120 units",
    teamSize: "15–25",
    timeline: "18 months",
    tools: "Projects, Tasks, Reports, AI analytics",
    benefits: "Unified visibility, risk alerts, fewer delays.",
  },
  commercial: {
    projectSize: "12,000 m²",
    teamSize: "40+",
    timeline: "24 months",
    tools: "Dashboard, AI, Mobile, Integrations",
    benefits: "Portfolio view, compliance, faster reporting.",
  },
  infrastructure: {
    projectSize: "Multi-site",
    teamSize: "80+",
    timeline: "36 months",
    tools: "Projects, Reports, AI, API",
    benefits: "Cross-site progress, risk prediction, audit trail.",
  },
  renovation: {
    projectSize: "50+ lots",
    teamSize: "10–20",
    timeline: "12 months",
    tools: "Tasks, Photo evidence, Daily reports",
    benefits: "Before/after tracking, quality control, on-time delivery.",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.cases" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function CasesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.cases");

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {CASE_SLUGS.map((slug) => {
          const data = CASE_DATA[slug];
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
                  <dd className="text-[var(--aistroyka-text-primary)]">{data.projectSize}</dd>
                </div>
                <div>
                  <dt className="text-[var(--aistroyka-text-tertiary)]">{t("teamSize")}</dt>
                  <dd className="text-[var(--aistroyka-text-primary)]">{data.teamSize}</dd>
                </div>
                <div>
                  <dt className="text-[var(--aistroyka-text-tertiary)]">{t("timeline")}</dt>
                  <dd className="text-[var(--aistroyka-text-primary)]">{data.timeline}</dd>
                </div>
              </dl>
              <p className="mt-3 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
                {data.benefits}
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
