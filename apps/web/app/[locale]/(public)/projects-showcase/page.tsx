import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "public.projectsShowcase" });
  return {
    title: `${t("title")} | Aistroyka`,
    description: t("metaDescription"),
  };
}

export default async function ProjectsShowcasePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("public.projectsShowcase");

  const sections = [
    { key: "dashboard" as const, desc: "Unified dashboard: projects, tasks, reports, and KPIs in one place." },
    { key: "aiAnalytics" as const, desc: "AI-powered analysis: progress, deviations, risks, and recommendations." },
    { key: "progressTracking" as const, desc: "Real-time progress tracking with photo evidence and timelines." },
    { key: "mobileReporting" as const, desc: "Field teams submit daily reports and evidence from mobile apps." },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <h1 className="text-[var(--aistroyka-font-title)] font-bold text-[var(--aistroyka-text-primary)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--aistroyka-font-body)] text-[var(--aistroyka-text-secondary)]">
        {t("metaDescription")}
      </p>
      <div className="mt-12 grid gap-8 sm:grid-cols-2">
        {sections.map(({ key, desc }) => (
          <div
            key={key}
            className="flex flex-col rounded-[var(--aistroyka-radius-card)] border border-[var(--aistroyka-border-subtle)] bg-[var(--aistroyka-surface)] p-6 shadow-[var(--aistroyka-shadow-e1)]"
          >
            <div className="mb-4 flex h-32 items-center justify-center rounded-[var(--aistroyka-radius-lg)] bg-[var(--aistroyka-bg-primary)] text-[var(--aistroyka-text-tertiary)]">
              Product preview
            </div>
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
