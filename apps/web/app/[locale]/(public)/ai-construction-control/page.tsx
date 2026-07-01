import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.aiControl" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function AiConstructionControlPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.aiControl");

  const sections = [
    { key: "whatAiAnalyzes" as const, desc: "AI analyzes site photos for progress, completeness, and deviations from plans or expectations." },
    { key: "photoWorkflows" as const, desc: "Before/after and time-series photo workflows with automatic analysis and alerts." },
    { key: "deviationRisk" as const, desc: "Deviation and risk detection with severity and suggested actions." },
    { key: "managerInsights" as const, desc: "Insights and recommendations for managers, prioritized by impact." },
    { key: "humanInTheLoop" as const, desc: "Decisions stay with humans; AI supports with analysis and suggestions." },
  ] as const;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 space-y-8">
        {sections.map(({ key, desc }) => (
          <div
            key={key}
            className="card rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <h2 className="text-[var(--aistroyka-font-title3)] font-semibold text-[var(--aistroyka-text-primary)]">
              {t(key)}
            </h2>
            <p className="mt-2 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
